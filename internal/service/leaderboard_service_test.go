package service

import (
	"encoding/json"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

func setupLeaderboardTestDB(t *testing.T) (*gorm.DB, *LeaderboardService) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.LeaderboardEntry{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	saveRepo := repository.NewPlayerSaveRepository(db)
	lbRepo := repository.NewLeaderboardRepository(db)
	userRepo := repository.NewUserRepository(db)
	return db, NewLeaderboardService(lbRepo, saveRepo, userRepo, true)
}

func saveWithStats(teamName string, combat, rest int, gold, xp float64) json.RawMessage {
	payload := map[string]interface{}{
		"teamName": teamName,
		"squad":    []interface{}{},
		"combatProgress": map[string]interface{}{
			"unlockedMapCount": 1,
			"currentMapId":     "elwynn-forest",
			"currentProgress":  0,
			"bossAvailable":    false,
		},
		"gold":      0,
		"inventory": []interface{}{},
		"playerStats": map[string]interface{}{
			"combatActionSteps": combat,
			"restSteps":         rest,
			"cumulativeGold":    gold,
			"cumulativeXp":      xp,
			"displayScaleN":     100,
			"battleCount":       0,
			"victoryCount":      0,
			"battleTimeline":    []interface{}{},
			"damageByHero":      map[string]interface{}{},
		},
	}
	raw, _ := json.Marshal(payload)
	return raw
}

func saveWithStatsAndTrack(teamName string, lifetimeSteps int, gold, xp float64) json.RawMessage {
	payload := map[string]interface{}{
		"teamName": teamName,
		"squad":    []interface{}{},
		"combatProgress": map[string]interface{}{
			"unlockedMapCount": 1,
			"currentMapId":     "elwynn-forest",
			"currentProgress":  0,
			"bossAvailable":    false,
		},
		"gold":      0,
		"inventory": []interface{}{},
		"playerStats": map[string]interface{}{
			"combatActionSteps": 0,
			"restSteps":         0,
			"cumulativeGold":    0,
			"cumulativeXp":      0,
			"displayScaleN":     100,
			"battleCount":       0,
			"victoryCount":      0,
			"battleTimeline":    []interface{}{},
			"damageByHero":      map[string]interface{}{},
		},
		"leaderboardTrack": map[string]interface{}{
			"lifetimeSteps": lifetimeSteps,
			"segments": []interface{}{
				map[string]interface{}{
					"steps": lifetimeSteps,
					"gold":  gold,
					"xp":    xp,
				},
			},
		},
	}
	raw, _ := json.Marshal(payload)
	return raw
}

func TestParseLeaderboardEntry_ComputesEfficiency(t *testing.T) {
	raw := saveWithStatsAndTrack("Alpha", 1000, 5000, 2000)
	entry, err := parseLeaderboardEntry(1, raw)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if entry == nil {
		t.Fatal("expected entry")
	}
	if entry.ExplorationSteps != 1000 {
		t.Fatalf("steps: got %d", entry.ExplorationSteps)
	}
	if entry.GoldPerStep != 5 {
		t.Fatalf("gold per step: got %v", entry.GoldPerStep)
	}
	if entry.XpPerStep != 2 {
		t.Fatalf("xp per step: got %v", entry.XpPerStep)
	}
	if entry.TeamName != "Alpha" {
		t.Fatalf("team: got %q", entry.TeamName)
	}
}

func TestUpsertFromSaveJSON_BelowThresholdDeletes(t *testing.T) {
	_, svc := setupLeaderboardTestDB(t)
	raw := saveWithStats("Low", 50, 40, 100, 50)
	if err := svc.UpsertFromSaveJSON(9, raw); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	resp, err := svc.GetLeaderboard(9)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if resp.Self.Eligible {
		t.Fatal("expected not eligible below 1000 lifetime steps")
	}
}

func TestGetLeaderboard_Top10OrderingAndSelfRank(t *testing.T) {
	_, svc := setupLeaderboardTestDB(t)

	entries := []struct {
		userID uint
		team   string
		steps  int
		gold   float64
		xp     float64
	}{
		{1, "GoldKing", 1000, 10000, 100},
		{2, "GoldSecond", 1000, 8000, 100},
		{3, "XpKing", 1000, 100, 9000},
		{4, "SelfTeam", 1200, 600, 300},
	}

	for _, e := range entries {
		raw := saveWithStatsAndTrack(e.team, e.steps, e.gold, e.xp)
		if err := svc.UpsertFromSaveJSON(e.userID, raw); err != nil {
			t.Fatalf("upsert user %d: %v", e.userID, err)
		}
	}

	resp, err := svc.GetLeaderboard(4)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if len(resp.GoldTop10) != 4 {
		t.Fatalf("gold top10 len: got %d", len(resp.GoldTop10))
	}
	if resp.GoldTop10[0].TeamName != "GoldKing" || resp.GoldTop10[0].Rank != 1 {
		t.Fatalf("gold #1: %+v", resp.GoldTop10[0])
	}
	if resp.XpTop10[0].TeamName != "XpKing" {
		t.Fatalf("xp #1: %+v", resp.XpTop10[0])
	}
	if !resp.Self.Eligible || resp.Self.GoldRank != 3 {
		t.Fatalf("self gold rank: %+v", resp.Self)
	}
	if resp.Self.GoldPer100Steps != 50 {
		t.Fatalf("self gold per 100: got %v", resp.Self.GoldPer100Steps)
	}
}

func TestGetLeaderboard_ExcludesE2ETestUsersWhenDisabled(t *testing.T) {
	db, svc := setupLeaderboardTestDB(t)
	userRepo := repository.NewUserRepository(db)
	svc = NewLeaderboardService(
		repository.NewLeaderboardRepository(db),
		repository.NewPlayerSaveRepository(db),
		userRepo,
		false,
	)

	if err := userRepo.Create(&model.User{Email: "bot@example.com", Password: "x", Token: "t1"}); err != nil {
		t.Fatalf("create test user: %v", err)
	}
	if err := userRepo.Create(&model.User{Email: "player@game.test", Password: "x", Token: "t2"}); err != nil {
		t.Fatalf("create real user: %v", err)
	}

	rawTest := saveWithStatsAndTrack("Bot Squad", 1000, 9000, 100)
	if err := svc.UpsertFromSaveJSON(1, rawTest); err != nil {
		t.Fatalf("upsert test user: %v", err)
	}
	rawReal := saveWithStatsAndTrack("Real Squad", 1000, 5000, 100)
	if err := svc.UpsertFromSaveJSON(2, rawReal); err != nil {
		t.Fatalf("upsert real user: %v", err)
	}

	resp, err := svc.GetLeaderboard(2)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if len(resp.GoldTop10) != 1 || resp.GoldTop10[0].TeamName != "Real Squad" {
		t.Fatalf("gold top10: %+v", resp.GoldTop10)
	}
	if resp.Self.GoldRank != 1 {
		t.Fatalf("self gold rank: %+v", resp.Self)
	}
}

func TestBackfillAll_LoadsExistingSaves(t *testing.T) {
	db, svc := setupLeaderboardTestDB(t)
	saveRepo := repository.NewPlayerSaveRepository(db)
	raw := saveWithStatsAndTrack("Backfill", 1000, 2000, 1000)
	if err := saveRepo.Upsert(7, string(raw)); err != nil {
		t.Fatalf("save upsert: %v", err)
	}
	if err := svc.BackfillAll(); err != nil {
		t.Fatalf("backfill: %v", err)
	}
	resp, err := svc.GetLeaderboard(7)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if !resp.Self.Eligible || resp.Self.TeamName != "Backfill" {
		t.Fatalf("self: %+v", resp.Self)
	}
}
