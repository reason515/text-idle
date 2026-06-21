package service

import "testing"

func TestAppendLeaderboardTrackSegment_TrimsRecentWindow(t *testing.T) {
	track := emptyLeaderboardTrack()
	track = appendLeaderboardTrackSegment(track, 700, 700, 70)
	track = appendLeaderboardTrackSegment(track, 500, 500, 50)
	if track.LifetimeSteps != 1200 {
		t.Fatalf("lifetime: got %d", track.LifetimeSteps)
	}
	steps, gold, xp := windowTotals(track)
	if steps != LeaderboardWindowSteps {
		t.Fatalf("window steps: got %d", steps)
	}
	if gold <= 0 || xp <= 0 {
		t.Fatalf("window totals: gold=%v xp=%v", gold, xp)
	}
}

func TestMigrateLeaderboardTrackFromPlayerStats(t *testing.T) {
	track := migrateLeaderboardTrackFromPlayerStats(emptyLeaderboardTrack(), playerStatsPayload{
		CombatActionSteps: 1200,
		RestSteps:         50,
		CumulativeGold:    5000,
		CumulativeXp:      2000,
	})
	if track.LifetimeSteps != 1250 {
		t.Fatalf("lifetime: got %d", track.LifetimeSteps)
	}
	steps, _, _ := windowTotals(track)
	if steps != LeaderboardWindowSteps {
		t.Fatalf("window steps: got %d", steps)
	}
}

func TestParseLeaderboardEntry_UsesRecentWindow(t *testing.T) {
	raw := []byte(`{
		"teamName":"Alpha",
		"leaderboardTrack":{
			"lifetimeSteps":1200,
			"segments":[{"steps":1000,"gold":5000,"xp":2000}]
		},
		"playerStats":{"combatActionSteps":0,"restSteps":0,"cumulativeGold":0,"cumulativeXp":0}
	}`)
	entry, err := parseLeaderboardEntry(1, raw)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if entry == nil {
		t.Fatal("expected entry")
	}
	if entry.ExplorationSteps != 1200 {
		t.Fatalf("lifetime steps: got %d", entry.ExplorationSteps)
	}
	if entry.GoldPerStep != 5 {
		t.Fatalf("gold per step: got %v", entry.GoldPerStep)
	}
	if entry.XpPerStep != 2 {
		t.Fatalf("xp per step: got %v", entry.XpPerStep)
	}
}
