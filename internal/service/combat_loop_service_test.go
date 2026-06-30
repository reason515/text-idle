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

type combatLoopHarness struct {
	db              *gorm.DB
	userID          uint
	saveRepo        *repository.PlayerSaveRepository
	combatStateRepo *repository.PlayerCombatStateRepository
	combatEventRepo *repository.CombatEventRepository
	saveService     *SaveService
	loop            *CombatLoopService
}

func setupCombatLoopHarness(t *testing.T, email string) *combatLoopHarness {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.PlayerCombatState{}, &model.CombatEvent{}); err != nil {
		t.Fatal(err)
	}
	user := model.User{Email: email, Password: "x", Token: "tok-" + email}
	if err := db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	saveRepo := repository.NewPlayerSaveRepository(db)
	combatStateRepo := repository.NewPlayerCombatStateRepository(db)
	combatEventRepo := repository.NewCombatEventRepository(db)
	saveService := NewSaveService(saveRepo, nil, nil)
	hub := NewCombatHub()
	loop := NewCombatLoopService(saveService, combatStateRepo, combatEventRepo, hub)
	return &combatLoopHarness{
		db:              db,
		userID:          user.ID,
		saveRepo:        saveRepo,
		combatStateRepo: combatStateRepo,
		combatEventRepo: combatEventRepo,
		saveService:     saveService,
		loop:            loop,
	}
}

func (h *combatLoopHarness) seedSave(t *testing.T, save json.RawMessage) {
	t.Helper()
	if err := h.saveRepo.Upsert(h.userID, string(save)); err != nil {
		t.Fatal(err)
	}
}

func saveGold(t *testing.T, saveService *SaveService, userID uint) float64 {
	t.Helper()
	raw, err := saveService.GetSave(userID)
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]interface{}
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatal(err)
	}
	gold, _ := m["gold"].(float64)
	return gold
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

func TestCombatLoopService_TickUser_respectsPause(t *testing.T) {
	h := setupCombatLoopHarness(t, "pause@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(-time.Second)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	goldBefore := saveGold(t, h.saveService, h.userID)
	if err := h.loop.Pause(h.userID, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.TickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	goldAfter := saveGold(t, h.saveService, h.userID)
	if goldAfter != goldBefore {
		t.Fatalf("expected no progress while paused, gold before=%v after=%v", goldBefore, goldAfter)
	}
	state, _ = h.combatStateRepo.GetByUserID(h.userID)
	if state.EventSeq != 0 {
		t.Fatalf("expected no events while paused, eventSeq=%d", state.EventSeq)
	}
}

func TestCombatLoopService_TickUser_respectsNextTickAt(t *testing.T) {
	h := setupCombatLoopHarness(t, "schedule@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(time.Hour)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	goldBefore := saveGold(t, h.saveService, h.userID)
	if err := h.loop.TickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	goldAfter := saveGold(t, h.saveService, h.userID)
	if goldAfter != goldBefore {
		t.Fatalf("expected no tick before next_tick_at, gold before=%v after=%v", goldBefore, goldAfter)
	}
}

func TestCombatLoopService_ForceTickUser_ignoresPauseAndSchedule(t *testing.T) {
	h := setupCombatLoopHarness(t, "force@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(time.Hour)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.Pause(h.userID, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ForceTickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	after, err := h.saveService.GetSave(h.userID)
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]interface{}
	json.Unmarshal(after, &m)
	stats, _ := m["playerStats"].(map[string]interface{})
	steps, _ := stats["combatActionSteps"].(float64)
	if steps <= 0 {
		t.Errorf("expected progress after force tick, steps=%v", steps)
	}
}

func TestCombatLoopService_TickUser_emitsLogBatchBeforeCycleComplete(t *testing.T) {
	h := setupCombatLoopHarness(t, "events@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(-time.Second)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.TickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	events, err := h.combatEventRepo.ListSince(h.userID, 0, 100)
	if err != nil {
		t.Fatal(err)
	}
	if len(events) < 2 {
		t.Fatalf("expected at least 2 events, got %d", len(events))
	}
	logIdx, completeIdx := -1, -1
	for i, ev := range events {
		switch ev.Type {
		case "combat.log_batch":
			logIdx = i
		case "combat.cycle_complete":
			completeIdx = i
		}
	}
	if logIdx < 0 || completeIdx < 0 {
		t.Fatalf("missing event types: %+v", events)
	}
	if logIdx > completeIdx {
		t.Fatalf("log_batch must precede cycle_complete, logIdx=%d completeIdx=%d", logIdx, completeIdx)
	}
	if events[logIdx].Seq >= events[completeIdx].Seq {
		t.Fatalf("log_batch seq must be less than cycle_complete, log=%d complete=%d", events[logIdx].Seq, events[completeIdx].Seq)
	}
}

func TestCombatLoopService_TickUser_clampsLastTickAtTo24hCap(t *testing.T) {
	h := setupCombatLoopHarness(t, "cap-clamp@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.LastTickAt = now.Add(-48 * time.Hour)
	state.NextTickAt = now.Add(-time.Second)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.TickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	state, _ = h.combatStateRepo.GetByUserID(h.userID)
	capStart := now.Add(-offlineCapHours * time.Hour)
	if state.LastTickAt.Before(capStart.Add(-time.Second)) {
		t.Fatalf("expected last_tick_at clamped near cap window, got %v capStart=%v", state.LastTickAt, capStart)
	}
}

func TestCombatLoopService_TickUser_offlineCapBlocksProgressBeyond24h(t *testing.T) {
	h := setupCombatLoopHarness(t, "cap-block@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.LastTickAt = now.Add(-48 * time.Hour)
	state.NextTickAt = now
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	goldBefore := saveGold(t, h.saveService, h.userID)
	if err := h.loop.TickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	goldAfter := saveGold(t, h.saveService, h.userID)
	if goldAfter != goldBefore {
		t.Fatalf("expected no combat beyond 24h cap when next_tick_at already at now, gold before=%v after=%v", goldBefore, goldAfter)
	}
	state, _ = h.combatStateRepo.GetByUserID(h.userID)
	if state.NextTickAt.Before(now.Add(-time.Second)) || state.NextTickAt.After(now.Add(time.Second)) {
		t.Fatalf("expected next_tick_at near now after cap skip, got %v", state.NextTickAt)
	}
}

func TestCombatLoopService_SyncCombatStateFromSave_whilePaused_fillsSquad(t *testing.T) {
	h := setupCombatLoopHarness(t, "paused-fill@test.com")
	emptySave := json.RawMessage(`{"teamName":"","squad":[],"combatProgress":{"currentMapId":"elwynn-forest"},"gold":0,"inventory":[],"playerStats":{}}`)
	h.seedSave(t, emptySave)
	now := time.Now()
	if err := h.loop.SyncCombatStateFromSave(h.userID, emptySave, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.Pause(h.userID, now); err != nil {
		t.Fatal(err)
	}
	filledSave := loadFixtureSave(t)
	h.seedSave(t, filledSave)
	if err := h.loop.SyncCombatStateFromSave(h.userID, filledSave, now); err != nil {
		t.Fatal(err)
	}
	state, err := h.combatStateRepo.GetByUserID(h.userID)
	if err != nil {
		t.Fatal(err)
	}
	if state.Status != model.CombatStatusPaused {
		t.Fatalf("expected paused after sync while paused, got %q", state.Status)
	}
	if err := h.loop.Resume(h.userID, now); err != nil {
		t.Fatal(err)
	}
	state, _ = h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(-time.Second)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.TickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	after, err := h.saveService.GetSave(h.userID)
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]interface{}
	json.Unmarshal(after, &m)
	stats, _ := m["playerStats"].(map[string]interface{})
	steps, _ := stats["combatActionSteps"].(float64)
	if steps <= 0 {
		t.Errorf("expected combat progress after resume with filled squad, steps=%v", steps)
	}
}

func TestCombatLoopService_Resume_setsNextTickAtNow(t *testing.T) {
	h := setupCombatLoopHarness(t, "resume@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.Pause(h.userID, now); err != nil {
		t.Fatal(err)
	}
	future := now.Add(2 * time.Hour)
	if err := h.loop.Resume(h.userID, future); err != nil {
		t.Fatal(err)
	}
	due, err := h.combatStateRepo.ListDue(future.Add(time.Second), 10)
	if err != nil {
		t.Fatal(err)
	}
	found := false
	for _, row := range due {
		if row.UserID == h.userID {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected user due after resume, due=%+v", due)
	}
}
