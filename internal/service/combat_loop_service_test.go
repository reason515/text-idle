package service

import (
	"encoding/json"
	"errors"
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
	db                *gorm.DB
	userID            uint
	saveRepo          *repository.PlayerSaveRepository
	combatStateRepo   *repository.PlayerCombatStateRepository
	combatEventRepo   *repository.CombatEventRepository
	leaderboardRepo    *repository.LeaderboardRepository
	saveService       *SaveService
	leaderboardService *LeaderboardService
	loop              *CombatLoopService
	hub               *CombatHub
}

func setupCombatLoopHarness(t *testing.T, email string) *combatLoopHarness {
	t.Helper()
	return setupCombatLoopHarnessWithLeaderboard(t, email, false)
}

func setupCombatLoopHarnessWithLeaderboard(t *testing.T, email string, withLeaderboard bool) *combatLoopHarness {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	models := []interface{}{
		&model.User{}, &model.PlayerSave{}, &model.PlayerCombatState{}, &model.CombatEvent{},
	}
	if withLeaderboard {
		models = append(models, &model.LeaderboardEntry{})
	}
	if err := db.AutoMigrate(models...); err != nil {
		t.Fatal(err)
	}
	user := model.User{Email: email, Password: "x", Token: "tok-" + email}
	if err := db.Create(&user).Error; err != nil {
		t.Fatal(err)
	}
	saveRepo := repository.NewPlayerSaveRepository(db)
	combatStateRepo := repository.NewPlayerCombatStateRepository(db)
	combatEventRepo := repository.NewCombatEventRepository(db)
	userRepo := repository.NewUserRepository(db)
	var saveService *SaveService
	var leaderboardRepo *repository.LeaderboardRepository
	var leaderboardService *LeaderboardService
	if withLeaderboard {
		leaderboardRepo = repository.NewLeaderboardRepository(db)
		leaderboardService = NewLeaderboardService(leaderboardRepo, saveRepo, userRepo, true)
		saveService = NewSaveService(saveRepo, leaderboardService, nil)
	} else {
		saveService = NewSaveService(saveRepo, nil, nil)
	}
	hub := NewCombatHub()
	loop := NewCombatLoopService(saveService, combatStateRepo, combatEventRepo, hub)
	h := &combatLoopHarness{
		db:                 db,
		userID:             user.ID,
		saveRepo:           saveRepo,
		combatStateRepo:    combatStateRepo,
		combatEventRepo:    combatEventRepo,
		leaderboardRepo:    leaderboardRepo,
		saveService:        saveService,
		leaderboardService: leaderboardService,
		loop:               loop,
		hub:                hub,
	}
	return h
}

func parseSavePlayerStats(t *testing.T, raw json.RawMessage) map[string]interface{} {
	t.Helper()
	var m map[string]interface{}
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatal(err)
	}
	stats, _ := m["playerStats"].(map[string]interface{})
	if stats == nil {
		return map[string]interface{}{}
	}
	return stats
}

func parseSaveLeaderboardTrack(t *testing.T, raw json.RawMessage) map[string]interface{} {
	t.Helper()
	var m map[string]interface{}
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatal(err)
	}
	track, _ := m["leaderboardTrack"].(map[string]interface{})
	if track == nil {
		return map[string]interface{}{}
	}
	return track
}

func saveBattleCount(t *testing.T, saveService *SaveService, userID uint) float64 {
	t.Helper()
	raw, err := saveService.GetSave(userID)
	if err != nil {
		t.Fatal(err)
	}
	stats := parseSavePlayerStats(t, raw)
	count, _ := stats["battleCount"].(float64)
	return count
}

func (h *combatLoopHarness) getLeaderboardEntry(t *testing.T) *model.LeaderboardEntry {
	t.Helper()
	if h.leaderboardRepo == nil {
		return nil
	}
	entry, err := h.leaderboardRepo.GetByUserID(h.userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil
	}
	if err != nil {
		t.Fatal(err)
	}
	return entry
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
	var logBatch map[string]interface{}
	if err := json.Unmarshal([]byte(events[logIdx].Payload), &logBatch); err != nil {
		t.Fatal(err)
	}
	payload, _ := logBatch["payload"].(map[string]interface{})
	if payload == nil {
		t.Fatal("log_batch missing payload")
	}
	if payload["encounter"] == nil {
		t.Error("log_batch payload missing encounter")
	}
	if payload["steps"] == nil {
		t.Error("log_batch payload missing steps")
	}
}

func TestCombatLoopService_WallClock_stopsAtOfflineCapUntil(t *testing.T) {
	h := setupCombatLoopHarness(t, "wall-cap@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.OfflineCapUntil = now.Add(-time.Minute)
	state.NextTickAt = now.Add(-time.Second)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	battlesBefore := saveBattleCount(t, h.saveService, h.userID)
	if err := h.loop.TickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	battlesAfter := saveBattleCount(t, h.saveService, h.userID)
	if battlesAfter != battlesBefore {
		t.Fatalf("expected no combat after offline cap expired, before=%v after=%v", battlesBefore, battlesAfter)
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

func TestCombatLoopService_Advance_runsNextTickWhenClientGated(t *testing.T) {
	h := setupCombatLoopHarness(t, "advance@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(clientResumeGateDuration)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	h.hub.SetUserConnectedForTest(h.userID, true)
	if err := h.loop.RecordPresence(h.userID, now); err != nil {
		t.Fatal(err)
	}
	goldBefore := saveGold(t, h.saveService, h.userID)
	if err := h.loop.Advance(h.userID, now); err != nil {
		t.Fatal(err)
	}
	after, err := h.saveService.GetSave(h.userID)
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]interface{}
	if err := json.Unmarshal(after, &m); err != nil {
		t.Fatal(err)
	}
	stats, _ := m["playerStats"].(map[string]interface{})
	steps, _ := stats["combatActionSteps"].(float64)
	if steps <= 0 {
		t.Fatalf("expected progress after advance, steps=%v goldBefore=%v", steps, goldBefore)
	}
	state, _ = h.combatStateRepo.GetByUserID(h.userID)
	if !isAwaitingClientResume(state.NextTickAt, now) {
		t.Fatalf("expected client resume gate after advance tick, next_tick_at=%v", state.NextTickAt)
	}
}

func TestCombatLoopService_Resume_doesNotArmSchedulerWhenClientGated(t *testing.T) {
	h := setupCombatLoopHarness(t, "resume@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(clientResumeGateDuration)
	state.LastCycleDelayMs = 60_000
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.Pause(h.userID, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.Resume(h.userID, now); err != nil {
		t.Fatal(err)
	}
	due, err := h.combatStateRepo.ListDue(now.Add(time.Second), 10)
	if err != nil {
		t.Fatal(err)
	}
	for _, row := range due {
		if row.UserID == h.userID {
			t.Fatalf("expected user not scheduler-due after unpause while client gated, due=%+v", due)
		}
	}
}

func TestCombatLoopService_ArmOffline_setsOfflineCapUntil24h(t *testing.T) {
	h := setupCombatLoopHarness(t, "arm-offline@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, now); err != nil {
		t.Fatal(err)
	}
	state, err := h.combatStateRepo.GetByUserID(h.userID)
	if err != nil {
		t.Fatal(err)
	}
	want := now.Add(offlineCapHours * time.Hour)
	if state.OfflineCapUntil.Sub(want).Abs() > 2*time.Second {
		t.Fatalf("offline_cap_until=%v want~=%v", state.OfflineCapUntil, want)
	}
	if !state.LastClientSeenAt.IsZero() {
		t.Fatal("expected last_client_seen_at cleared on arm-offline")
	}
}

func TestCombatLoopService_WallClockTick_setsNextTickAtToDelay(t *testing.T) {
	h := setupCombatLoopHarness(t, "wall-next@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(-time.Second)
	state.LastCycleDelayMs = 5000
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.TickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	state, _ = h.combatStateRepo.GetByUserID(h.userID)
	if isAwaitingClientResume(state.NextTickAt, now) {
		t.Fatalf("expected wall-clock next_tick_at, got far future %v", state.NextTickAt)
	}
	if state.NextTickAt.Before(now) {
		t.Fatalf("expected next_tick_at in the future, got %v", state.NextTickAt)
	}
}

func TestCombatLoopService_ClientGated_presenceWithoutWebsocket(t *testing.T) {
	h := setupCombatLoopHarness(t, "presence-gate@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	h.hub.SetUserConnectedForTest(h.userID, false)
	if err := h.loop.RecordPresence(h.userID, now); err != nil {
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
	state, _ = h.combatStateRepo.GetByUserID(h.userID)
	if !isAwaitingClientResume(state.NextTickAt, now) {
		t.Fatalf("expected client-gated next_tick_at with presence only, got %v", state.NextTickAt)
	}
}

func TestCombatLoopService_ClientGatedTick_setsFarFutureNextTickAt(t *testing.T) {
	h := setupCombatLoopHarness(t, "client-gate@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	h.hub.SetUserConnectedForTest(h.userID, true)
	if err := h.loop.RecordPresence(h.userID, now); err != nil {
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
	state, _ = h.combatStateRepo.GetByUserID(h.userID)
	if !isAwaitingClientResume(state.NextTickAt, now) {
		t.Fatalf("expected client-gated next_tick_at, got %v", state.NextTickAt)
	}
}

func TestCombatLoopService_WallClock_multipleTicks_accumulateStats(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "1")
	t.Setenv("COMBAT_MAX_OFFLINE_TICKS_PER_SCAN", "5")
	h := setupCombatLoopHarness(t, "wall-stats@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, now); err != nil {
		t.Fatal(err)
	}
	before := saveBattleCount(t, h.saveService, h.userID)
	for i := 0; i < 3; i++ {
		state, _ := h.combatStateRepo.GetByUserID(h.userID)
		state.NextTickAt = now.Add(-time.Second)
		if err := h.combatStateRepo.Upsert(state); err != nil {
			t.Fatal(err)
		}
		if err := h.loop.ForceTickUser(h.userID, now.Add(time.Duration(i)*time.Second)); err != nil {
			t.Fatal(err)
		}
	}
	after := saveBattleCount(t, h.saveService, h.userID)
	if after-before < 3 {
		t.Fatalf("expected at least 3 battles, before=%v after=%v", before, after)
	}
	raw, _ := h.saveService.GetSave(h.userID)
	stats := parseSavePlayerStats(t, raw)
	steps, _ := stats["combatActionSteps"].(float64)
	if steps <= 0 {
		t.Fatalf("expected combatActionSteps > 0, got %v", steps)
	}
}

func TestCombatLoopService_WallClockTick_updatesLeaderboardTrack(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "1")
	h := setupCombatLoopHarnessWithLeaderboard(t, "wall-lb@test.com", true)
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(-time.Second)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ForceTickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	raw, err := h.saveService.GetSave(h.userID)
	if err != nil {
		t.Fatal(err)
	}
	track := parseSaveLeaderboardTrack(t, raw)
	lifetime, _ := track["lifetimeSteps"].(float64)
	if lifetime <= 0 {
		t.Fatalf("expected leaderboardTrack.lifetimeSteps > 0, got %v", lifetime)
	}
}

func TestCombatLoopService_Resume_doesNotCatchUp(t *testing.T) {
	h := setupCombatLoopHarness(t, "resume-no-catchup@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(clientResumeGateDuration)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	before := saveBattleCount(t, h.saveService, h.userID)
	if err := h.loop.Resume(h.userID, now); err != nil {
		t.Fatal(err)
	}
	after := saveBattleCount(t, h.saveService, h.userID)
	if after != before {
		t.Fatalf("resume should not catch up battles, before=%v after=%v", before, after)
	}
}

func TestCombatLoopService_Backfill_migratesStuckClientGated(t *testing.T) {
	h := setupCombatLoopHarness(t, "backfill@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = now.Add(clientResumeGateDuration)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if _, err := h.loop.BackfillStuckCombatStates(now); err != nil {
		t.Fatal(err)
	}
	state, _ = h.combatStateRepo.GetByUserID(h.userID)
	if isAwaitingClientResume(state.NextTickAt, now) {
		t.Fatalf("expected backfill to migrate stuck client gate, next_tick_at=%v", state.NextTickAt)
	}
	if state.OfflineCapUntil.IsZero() {
		t.Fatal("expected offline_cap_until set after backfill migration")
	}
}

func (h *combatLoopHarness) wallClockTick(t *testing.T, now time.Time) {
	t.Helper()
	state, err := h.combatStateRepo.GetByUserID(h.userID)
	if err != nil {
		t.Fatal(err)
	}
	state.NextTickAt = now.Add(-time.Second)
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.TickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
}

func battleTimelineEndedAtMs(t *testing.T, raw json.RawMessage) []float64 {
	t.Helper()
	stats := parseSavePlayerStats(t, raw)
	timeline, _ := stats["battleTimeline"].([]interface{})
	out := make([]float64, 0, len(timeline))
	for _, row := range timeline {
		entry, _ := row.(map[string]interface{})
		ms, _ := entry["endedAtMs"].(float64)
		out = append(out, ms)
	}
	return out
}

func TestCombatLoopService_BurstWallClock_respectsMaxTicksPerScan(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "1")
	t.Setenv("COMBAT_MAX_OFFLINE_TICKS_PER_SCAN", "3")
	h := setupCombatLoopHarness(t, "burst-scan@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	base := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, base); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, base); err != nil {
		t.Fatal(err)
	}
	state, _ := h.combatStateRepo.GetByUserID(h.userID)
	state.NextTickAt = base.Add(-2 * time.Hour)
	state.LastCycleDelayMs = 200
	if err := h.combatStateRepo.Upsert(state); err != nil {
		t.Fatal(err)
	}
	before := saveBattleCount(t, h.saveService, h.userID)
	tickNow := base.Add(2 * time.Hour)
	if err := h.loop.TickUser(h.userID, tickNow); err != nil {
		t.Fatal(err)
	}
	after := saveBattleCount(t, h.saveService, h.userID)
	delta := after - before
	if delta > 3 {
		t.Fatalf("expected at most 3 burst ticks per scan, before=%v after=%v delta=%v", before, after, delta)
	}
	if delta < 1 {
		t.Fatalf("expected at least 1 burst tick when overdue, before=%v after=%v delta=%v", before, after, delta)
	}
}

func TestCombatLoopService_WallClock_burstTimelineEndedAtMs_increments(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "1")
	h := setupCombatLoopHarness(t, "burst-ms@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	base := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, base); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, base); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 3; i++ {
		tickAt := base.Add(time.Duration(i) * time.Second)
		if err := h.loop.ForceTickUser(h.userID, tickAt); err != nil {
			t.Fatal(err)
		}
	}
	raw, err := h.saveService.GetSave(h.userID)
	if err != nil {
		t.Fatal(err)
	}
	ended := battleTimelineEndedAtMs(t, raw)
	if len(ended) < 3 {
		t.Fatalf("expected at least 3 timeline entries, got %d", len(ended))
	}
	lastThree := ended[len(ended)-3:]
	if !(lastThree[0] < lastThree[1] && lastThree[1] < lastThree[2]) {
		t.Fatalf("expected strictly increasing endedAtMs, got %v", lastThree)
	}
}

func TestCombatLoopService_WallClock_paused_doesNotUpdateStats(t *testing.T) {
	h := setupCombatLoopHarness(t, "wall-paused@test.com")
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.Pause(h.userID, now); err != nil {
		t.Fatal(err)
	}
	before := saveBattleCount(t, h.saveService, h.userID)
	h.wallClockTick(t, now)
	after := saveBattleCount(t, h.saveService, h.userID)
	if after != before {
		t.Fatalf("paused wall-clock tick should not update stats, before=%v after=%v", before, after)
	}
}

func TestCombatLoopService_WallClockTick_upsertsLeaderboardEntry(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "1")
	h := setupCombatLoopHarnessWithLeaderboard(t, "wall-lb-entry@test.com", true)
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, now); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 40; i++ {
		state, _ := h.combatStateRepo.GetByUserID(h.userID)
		state.NextTickAt = now.Add(-time.Second)
		if err := h.combatStateRepo.Upsert(state); err != nil {
			t.Fatal(err)
		}
		if err := h.loop.ForceTickUser(h.userID, now.Add(time.Duration(i)*time.Second)); err != nil {
			t.Fatal(err)
		}
		entry := h.getLeaderboardEntry(t)
		if entry != nil {
			raw, _ := h.saveService.GetSave(h.userID)
			track := parseSaveLeaderboardTrack(t, raw)
			lifetime, _ := track["lifetimeSteps"].(float64)
			if entry.ExplorationSteps != int(lifetime) {
				t.Fatalf("entry steps=%d save track=%v", entry.ExplorationSteps, lifetime)
			}
			return
		}
	}
	t.Fatal("expected leaderboard entry after enough wall-clock ticks")
}

func TestCombatLoopService_WallClock_belowMinSteps_notEligible(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "1")
	h := setupCombatLoopHarnessWithLeaderboard(t, "wall-below-min@test.com", true)
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ForceTickUser(h.userID, now); err != nil {
		t.Fatal(err)
	}
	raw, _ := h.saveService.GetSave(h.userID)
	track := parseSaveLeaderboardTrack(t, raw)
	lifetime, _ := track["lifetimeSteps"].(float64)
	if lifetime >= float64(LeaderboardMinLifetimeSteps) {
		t.Fatalf("fixture tick should stay below min steps for this test, lifetime=%v", lifetime)
	}
	entry := h.getLeaderboardEntry(t)
	if entry != nil {
		t.Fatalf("expected no leaderboard entry below %d steps, got %+v", LeaderboardMinLifetimeSteps, entry)
	}
}

func TestCombatLoopService_WallClock_crossesMinSteps_becomesEligible(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "1")
	h := setupCombatLoopHarnessWithLeaderboard(t, "wall-eligible@test.com", true)
	save := loadFixtureSave(t)
	h.seedSave(t, save)
	now := time.Now()
	if err := h.loop.EnsureCombatState(h.userID, save, now); err != nil {
		t.Fatal(err)
	}
	if err := h.loop.ArmOffline(h.userID, now); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 40; i++ {
		state, _ := h.combatStateRepo.GetByUserID(h.userID)
		state.NextTickAt = now.Add(-time.Second)
		if err := h.combatStateRepo.Upsert(state); err != nil {
			t.Fatal(err)
		}
		if err := h.loop.ForceTickUser(h.userID, now.Add(time.Duration(i)*time.Second)); err != nil {
			t.Fatal(err)
		}
		raw, _ := h.saveService.GetSave(h.userID)
		track := parseSaveLeaderboardTrack(t, raw)
		lifetime, _ := track["lifetimeSteps"].(float64)
		if lifetime >= float64(LeaderboardMinLifetimeSteps) {
			entry := h.getLeaderboardEntry(t)
			if entry == nil {
				t.Fatalf("expected leaderboard entry once lifetimeSteps=%v", lifetime)
			}
			return
		}
	}
	t.Fatalf("expected lifetimeSteps to reach %d within 40 ticks", LeaderboardMinLifetimeSteps)
}
