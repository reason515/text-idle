//go:build release

package server

import (
	"io/fs"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/static"
	"gorm.io/gorm"
)

func TestNewRouter_servesEmbeddedIndex(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	sub, err := fs.Sub(*static.GetFS(), "web")
	if err != nil {
		t.Fatalf("fs.Sub: %v", err)
	}
	_ = sub
	r := NewRouter(db, *static.GetFS(), true)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("GET / status = %d body = %q", rec.Code, rec.Body.String())
	}
}
