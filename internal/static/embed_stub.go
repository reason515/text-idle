//go:build !release
// +build !release

package static

import "embed"

// WebFS is nil when building without -tags release (dev/E2E mode).
var WebFS *embed.FS = nil

// GetFS returns nil for dev build.
func GetFS() *embed.FS {
	return nil
}
