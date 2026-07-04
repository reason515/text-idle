//go:build release
// +build release

package static

import "embed"

// Web holds the built frontend (populated by build script before go build).
// Use all:web so Vite chunks such as _plugin-vue_export-helper-*.js are included
// (go:embed web/* skips names beginning with '_' or '.').
//go:embed all:web
var Web embed.FS

// WebFS is nil when building without -tags release.
var WebFS *embed.FS = &Web

// GetFS returns the embedded frontend FS for release build, nil for dev.
func GetFS() *embed.FS {
	return WebFS
}
