//go:build release

package server

import (
	"io/fs"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/static"
)

func TestServeSPA_embeddedWebRoot(t *testing.T) {
	gin.SetMode(gin.TestMode)
	sub, err := fs.Sub(*static.GetFS(), "web")
	if err != nil {
		t.Fatalf("fs.Sub: %v", err)
	}

	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)
	c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
	c.Request.Header.Set("Accept-Encoding", "gzip")
	serveSPA(sub)(c)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %q", rec.Code, rec.Body.String())
	}
	if rec.Header().Get("Content-Encoding") != "gzip" {
		t.Fatalf("expected gzip, got %q", rec.Header().Get("Content-Encoding"))
	}
	if len(rec.Body.Bytes()) == 0 {
		t.Fatal("empty body")
	}
}
