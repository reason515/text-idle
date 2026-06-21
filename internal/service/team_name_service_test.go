package service

import (
	"encoding/json"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

func setupTeamNameTestDB(t *testing.T) (*gorm.DB, *SaveService, *TeamNameService) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.LeaderboardEntry{}, &model.TeamNameClaim{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	saveRepo := repository.NewPlayerSaveRepository(db)
	lbRepo := repository.NewLeaderboardRepository(db)
	teamRepo := repository.NewTeamNameRepository(db)
	lbSvc := NewLeaderboardService(lbRepo, saveRepo)
	teamSvc := NewTeamNameService(teamRepo, saveRepo)
	saveSvc := NewSaveService(saveRepo, lbSvc, teamSvc)
	return db, saveSvc, teamSvc
}

func saveJSONWithTeamName(name string) json.RawMessage {
	raw, _ := json.Marshal(map[string]interface{}{
		"teamName": name,
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
	})
	return raw
}

func TestPutSave_RejectsDuplicateTeamName(t *testing.T) {
	_, saveSvc, _ := setupTeamNameTestDB(t)
	raw := saveJSONWithTeamName("Unique Squad")
	if err := saveSvc.PutSave(1, raw); err != nil {
		t.Fatalf("first save: %v", err)
	}
	if err := saveSvc.PutSave(2, raw); err != ErrTeamNameTaken {
		t.Fatalf("expected ErrTeamNameTaken, got %v", err)
	}
}

func TestPutSave_AllowsSameUserToKeepTeamName(t *testing.T) {
	_, saveSvc, _ := setupTeamNameTestDB(t)
	raw := saveJSONWithTeamName("Keep Name")
	if err := saveSvc.PutSave(3, raw); err != nil {
		t.Fatalf("first save: %v", err)
	}
	if err := saveSvc.PutSave(3, raw); err != nil {
		t.Fatalf("second save same user: %v", err)
	}
}

func TestPutSave_AllowsEmptyTeamNameForMultipleUsers(t *testing.T) {
	_, saveSvc, _ := setupTeamNameTestDB(t)
	raw := saveJSONWithTeamName("")
	if err := saveSvc.PutSave(4, raw); err != nil {
		t.Fatalf("user 4: %v", err)
	}
	if err := saveSvc.PutSave(5, raw); err != nil {
		t.Fatalf("user 5: %v", err)
	}
}
