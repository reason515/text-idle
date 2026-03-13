//go:build release
// +build release

package static

import "embed"

// Web holds the built frontend (populated by build script before go build).
//go:embed web/*
var Web embed.FS

// WebFS is nil when building without -tags release.
var WebFS *embed.FS = &Web

// GetFS returns the embedded frontend FS for release build, nil for dev.
func GetFS() *embed.FS {
	return WebFS
}
