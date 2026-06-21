package server

import (
	"compress/gzip"
	"io/fs"
	"mime"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

func staticCacheControl(path string) string {
	switch {
	case path == "index.html":
		return "no-cache, must-revalidate"
	case strings.HasPrefix(path, "assets/"):
		return "public, max-age=31536000, immutable"
	case strings.HasPrefix(path, "fonts/"), strings.HasPrefix(path, "audio/"):
		return "public, max-age=604800"
	default:
		return "public, max-age=3600"
	}
}

func isGzipEligible(path string) bool {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".html", ".js", ".css", ".svg", ".json", ".map", ".txt", ".xml":
		return true
	default:
		return false
	}
}

func contentTypeForPath(path string) string {
	if ct := mime.TypeByExtension(filepath.Ext(path)); ct != "" {
		return ct
	}
	return "application/octet-stream"
}

func wantsGzip(r *http.Request) bool {
	return strings.Contains(r.Header.Get("Accept-Encoding"), "gzip")
}

func serveStaticFile(w http.ResponseWriter, r *http.Request, fsys fs.FS, path string) {
	w.Header().Set("Cache-Control", staticCacheControl(path))

	if isGzipEligible(path) && wantsGzip(r) {
		data, err := fs.ReadFile(fsys, path)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", contentTypeForPath(path))
		w.Header().Set("Content-Encoding", "gzip")
		w.Header().Set("Vary", "Accept-Encoding")
		gz := gzip.NewWriter(w)
		defer gz.Close()
		_, _ = gz.Write(data)
		return
	}

	http.ServeFileFS(w, r, fsys, path)
}

// serveSPA serves static files; falls back to index.html for SPA client-side routing.
// Uses custom headers (Cache-Control, gzip for text assets) instead of raw ServeFileFS alone.
func serveSPA(fsys fs.FS) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := strings.TrimPrefix(c.Request.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		f, err := fsys.Open(path)
		if err == nil {
			defer f.Close()
			stat, statErr := f.Stat()
			if statErr == nil && !stat.IsDir() {
				c.Status(http.StatusOK)
				serveStaticFile(c.Writer, c.Request, fsys, path)
				return
			}
		}
		c.Status(http.StatusOK)
		serveStaticFile(c.Writer, c.Request, fsys, "index.html")
	}
}
