package server

import (
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestStaticCacheControl(t *testing.T) {
	tests := []struct {
		path string
		want string
	}{
		{"index.html", "no-cache, must-revalidate"},
		{"assets/index-abc.js", "public, max-age=31536000, immutable"},
		{"fonts/ark-pixel.woff2", "public, max-age=604800"},
		{"audio/sfx/fs_phys_hit.wav", "public, max-age=604800"},
		{"vite.svg", "public, max-age=3600"},
	}
	for _, tt := range tests {
		if got := staticCacheControl(tt.path); got != tt.want {
			t.Errorf("staticCacheControl(%q) = %q, want %q", tt.path, got, tt.want)
		}
	}
}

func TestServeStaticFile_gzipJS(t *testing.T) {
	fsys := fstest.MapFS{
		"assets/app.js": &fstest.MapFile{Data: []byte("console.log(1)")},
	}
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
	req.Header.Set("Accept-Encoding", "gzip")

	serveStaticFile(rec, req, fsys, "assets/app.js")

	if got := rec.Header().Get("Cache-Control"); got != "public, max-age=31536000, immutable" {
		t.Fatalf("cache-control = %q", got)
	}
	if rec.Header().Get("Content-Encoding") != "gzip" {
		t.Fatal("expected gzip encoding for JS")
	}
	gr, err := gzip.NewReader(rec.Body)
	if err != nil {
		t.Fatalf("gzip reader: %v", err)
	}
	raw, err := io.ReadAll(gr)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	if string(raw) != "console.log(1)" {
		t.Fatalf("body = %q", string(raw))
	}
}

func TestServeStaticFile_skipGzipForBinary(t *testing.T) {
	fsys := fstest.MapFS{
		"fonts/ark-pixel.woff2": &fstest.MapFile{Data: []byte{1, 2, 3}},
	}
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/fonts/ark-pixel.woff2", nil)
	req.Header.Set("Accept-Encoding", "gzip")

	serveStaticFile(rec, req, fsys, "fonts/ark-pixel.woff2")

	if rec.Header().Get("Content-Encoding") == "gzip" {
		t.Fatal("woff2 should not be gzip-encoded")
	}
	if rec.Body.String() != string([]byte{1, 2, 3}) {
		t.Fatalf("unexpected body %q", rec.Body.String())
	}
}

func TestServeSPA_routes(t *testing.T) {
	fsys := fstest.MapFS{
		"index.html":               &fstest.MapFile{Data: []byte("<html>spa</html>")},
		"assets/index-deadbeef.js": &fstest.MapFile{Data: []byte("ok")},
	}

	t.Run("root serves index with no-cache", func(t *testing.T) {
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
		serveSPA(fsys)(c)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d", rec.Code)
		}
		if rec.Header().Get("Cache-Control") != "no-cache, must-revalidate" {
			t.Fatalf("cache-control = %q", rec.Header().Get("Cache-Control"))
		}
		if rec.Body.String() != "<html>spa</html>" {
			t.Fatalf("body = %q", rec.Body.String())
		}
	})

	t.Run("unknown path falls back to index.html", func(t *testing.T) {
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		c.Request = httptest.NewRequest(http.MethodGet, "/main", nil)
		serveSPA(fsys)(c)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d", rec.Code)
		}
		if rec.Body.String() != "<html>spa</html>" {
			t.Fatalf("body = %q", rec.Body.String())
		}
	})

	t.Run("hashed asset is cached and gzip eligible", func(t *testing.T) {
		rec := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(rec)
		c.Request = httptest.NewRequest(http.MethodGet, "/assets/index-deadbeef.js", nil)
		c.Request.Header.Set("Accept-Encoding", "gzip")
		serveSPA(fsys)(c)

		if rec.Header().Get("Cache-Control") != "public, max-age=31536000, immutable" {
			t.Fatalf("cache-control = %q", rec.Header().Get("Cache-Control"))
		}
		if rec.Header().Get("Content-Encoding") != "gzip" {
			t.Fatal("expected gzip for JS asset")
		}
	})
}
