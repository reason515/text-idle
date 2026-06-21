//go:build release

package static

import (
	"io/fs"
	"testing"
)

func TestEmbedWebHasIndexHTML(t *testing.T) {
	sub, err := fs.Sub(Web, "web")
	if err != nil {
		t.Fatalf("fs.Sub: %v", err)
	}
	data, err := fs.ReadFile(sub, "index.html")
	if err != nil {
		t.Fatalf("read index.html: %v", err)
	}
	if len(data) == 0 {
		t.Fatal("index.html is empty")
	}
	entries, err := fs.ReadDir(sub, "assets")
	if err != nil {
		t.Fatalf("read assets dir: %v", err)
	}
	if len(entries) == 0 {
		t.Fatal("assets dir is empty in embed")
	}
}
