package model

import "strings"

// IsE2ETestEmail reports reserved example.com addresses used by automated tests.
func IsE2ETestEmail(email string) bool {
	return strings.HasSuffix(strings.ToLower(strings.TrimSpace(email)), "@example.com")
}
