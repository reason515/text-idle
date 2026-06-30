package service

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

func loadFixtureSave(t *testing.T) json.RawMessage {
	t.Helper()
	_, file, _, _ := runtime.Caller(0)
	root := filepath.Clean(filepath.Join(filepath.Dir(file), "..", ".."))
	raw, err := os.ReadFile(filepath.Join(root, "testdata", "combat", "server_cycle_fixed_trio.json"))
	if err != nil {
		t.Fatal(err)
	}
	var fix map[string]json.RawMessage
	if err := json.Unmarshal(raw, &fix); err != nil {
		t.Fatal(err)
	}
	return fix["save"]
}

func TestCombatLoopService_SyncActivatesEmptySquadAfterRecruit(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.PlayerCombatState{}, &model.CombatEvent{}); err != nil {
		t.Fatal(err)
	}
	user := model.User{Email: "sync@test.com", Password: "x", Token: "tok2"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	emptySave := json.RawMessage(`{"teamName":"","squad":[],"combatProgress":{"currentMapId":"elwynn-forest"},"gold":0,"inventory":[],"playerStats":{}}`)
	saveRepo := repository.NewPlayerSaveRepository(db)
	if err := saveRepo.Upsert(user.ID, string(emptySave)); err != nil {
		t.Fatal(err)
	}
	combatStateRepo := repository.NewPlayerCombatStateRepository(db)
	combatEventRepo := repository.NewCombatEventRepository(db)
	saveService := NewSaveService(saveRepo, nil, nil)
	hub := NewCombatHub()
	loop := NewCombatLoopService(saveService, combatStateRepo, combatEventRepo, hub)
	now := time.Now()
	if err := loop.SyncCombatStateFromSave(user.ID, emptySave, now); err != nil {
		t.Fatal(err)
	}
	state, err := combatStateRepo.GetByUserID(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != model.CombatStatusEmptySquad {
		t.Fatalf("expected empty_squad after intro-less create, got %q", state.Status)
	}

	filledSave := loadFixtureSave(t)
	if err := saveRepo.Upsert(user.ID, string(filledSave)); err != nil {
		t.Fatal(err)
	}
	if err := loop.SyncCombatStateFromSave(user.ID, filledSave, now); err != nil {
		t.Fatal(err)
	}
	state, err = combatStateRepo.GetByUserID(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != model.CombatStatusRunning {
		t.Fatalf("expected running after squad filled, got %q", state.Status)
	}
	if state.NextTickAt.After(now.Add(2 * time.Second)) {
		t.Fatalf("expected next_tick_at near now after activation, got %v", state.NextTickAt)
	}

	due, err := combatStateRepo.ListDue(now.Add(time.Second), 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(due) != 1 || due[0].UserID != user.ID {
		t.Fatalf("expected scheduler to pick up user after activation, due=%+v", due)
	}
}

func TestCombatLoopService_BackfillStuckCombatStates_activatesEmptySquad(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.PlayerCombatState{}, &model.CombatEvent{}); err != nil {
		t.Fatal(err)
	}
	user := model.User{Email: "backfill@test.com", Password: "x", Token: "tok3"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	filledSave := loadFixtureSave(t)
	saveRepo := repository.NewPlayerSaveRepository(db)
	if err := saveRepo.Upsert(user.ID, string(filledSave)); err != nil {
		t.Fatal(err)
	}
	combatStateRepo := repository.NewPlayerCombatStateRepository(db)
	combatEventRepo := repository.NewCombatEventRepository(db)
	saveService := NewSaveService(saveRepo, nil, nil)
	hub := NewCombatHub()
	loop := NewCombatLoopService(saveService, combatStateRepo, combatEventRepo, hub)
	now := time.Now()
	emptySave := json.RawMessage(`{"teamName":"","squad":[],"combatProgress":{"currentMapId":"elwynn-forest"},"gold":0,"inventory":[],"playerStats":{}}`)
	if err := loop.SyncCombatStateFromSave(user.ID, emptySave, now); err != nil {
		t.Fatal(err)
	}
	state, err := combatStateRepo.GetByUserID(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != model.CombatStatusEmptySquad {
		t.Fatalf("expected empty_squad before backfill, got %q", state.Status)
	}
	if _, err := loop.BackfillStuckCombatStates(now); err != nil {
		t.Fatal(err)
	}
	state, err = combatStateRepo.GetByUserID(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != model.CombatStatusRunning {
		t.Fatalf("expected running after backfill, got %q", state.Status)
	}
}

func TestCombatLoopService_TickUser_updatesGold(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.PlayerCombatState{}, &model.CombatEvent{}); err != nil {
		t.Fatal(err)
	}
	user := model.User{Email: "tick@test.com", Password: "x", Token: "tok1"}
	if err := db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	save := loadFixtureSave(t)
	saveRepo := repository.NewPlayerSaveRepository(db)
	if err := saveRepo.Upsert(user.ID, string(save)); err != nil {
		t.Fatal(err)
	}
	combatStateRepo := repository.NewPlayerCombatStateRepository(db)
	combatEventRepo := repository.NewCombatEventRepository(db)
	saveService := NewSaveService(saveRepo, nil, nil)
	hub := NewCombatHub()
	loop := NewCombatLoopService(saveService, combatStateRepo, combatEventRepo, hub)
	now := time.Now()
	if err := loop.EnsureCombatState(user.ID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := combatStateRepo.GetByUserID(user.ID)
	state.NextTickAt = now.Add(-time.Second)
	if err := combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if err := loop.TickUser(user.ID, now); err != nil {
		t.Fatal(err)
	}
	after, err := saveService.GetSave(user.ID)
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]interface{}
	json.Unmarshal(after, &m)
	stats, _ := m["playerStats"].(map[string]interface{})
	steps, _ := stats["combatActionSteps"].(float64)
	if steps <= 0 {
		t.Errorf("expected combat progress after tick, steps=%v gold=%v", steps, m["gold"])
	}
}
