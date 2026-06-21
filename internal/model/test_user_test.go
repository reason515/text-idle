package model

import "testing"

func TestIsE2ETestEmail(t *testing.T) {
	tests := []struct {
		email string
		want  bool
	}{
		{"bot@example.com", true},
		{"leaderboard-abc@example.com", true},
		{"  Player@Game.Test  ", false},
		{"", false},
	}
	for _, tc := range tests {
		if got := IsE2ETestEmail(tc.email); got != tc.want {
			t.Fatalf("IsE2ETestEmail(%q) = %v, want %v", tc.email, got, tc.want)
		}
	}
}
