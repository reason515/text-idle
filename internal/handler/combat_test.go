package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"github.com/text-idle/text-idle/internal/service"
	"gorm.io/gorm"
)

func loadCombatFixtureSave(t *testing.T) json.RawMessage {
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

type combatTestRouter struct {
	engine *gin.Engine
	token  string
	db     *gorm.DB
}

func setupCombatTestRouter(t *testing.T) *combatTestRouter {
	t.Helper()
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(
		&model.User{},
		&model.PlayerSave{},
		&model.PlayerCombatState{},
		&model.CombatEvent{},
	); err != nil {
		t.Fatal(err)
	}

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := NewAuthHandler(authService)
	saveRepo := repository.NewPlayerSaveRepository(db)
	combatStateRepo := repository.NewPlayerCombatStateRepository(db)
	combatEventRepo := repository.NewCombatEventRepository(db)
	saveService := service.NewSaveService(saveRepo, nil, nil)
	combatHub := service.NewCombatHub()
	combatLoop := service.NewCombatLoopService(saveService, combatStateRepo, combatEventRepo, combatHub)
	saveHandler := NewSaveHandler(saveService, combatLoop)
	combatHandler := NewCombatHandler(combatLoop, saveService, combatEventRepo, combatHub)
	authMw := middleware.AuthRequired(userRepo)

	r := gin.New()
	r.POST("/register", authHandler.Register)
	r.GET("/save", authMw, saveHandler.Get)
	r.GET("/combat/status", authMw, combatHandler.Status)
	r.GET("/combat/events", authMw, combatHandler.Events)
	r.POST("/combat/pause", authMw, combatHandler.Pause)
	r.POST("/combat/resume", authMw, combatHandler.Resume)
	r.POST("/combat/arm-offline", authMw, combatHandler.ArmOffline)
	r.POST("/combat/presence", authMw, combatHandler.Presence)
	r.POST("/debug/combat/tick", authMw, combatHandler.DebugTick)

	regBody, _ := json.Marshal(map[string]string{"email": "combat@example.com", "password": "password123"})
	regReq := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(regBody))
	regReq.Header.Set("Content-Type", "application/json")
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("register failed: %d %s", regW.Code, regW.Body.String())
	}
	var regResp RegisterResponse
	json.Unmarshal(regW.Body.Bytes(), &regResp)

	save := loadCombatFixtureSave(t)
	if err := saveRepo.Upsert(1, string(save)); err != nil {
		t.Fatal(err)
	}
	now := time.Now()
	if err := combatLoop.EnsureCombatState(1, save, now); err != nil {
		t.Fatal(err)
	}

	return &combatTestRouter{engine: r, token: regResp.Token, db: db}
}

func TestCombatHandler_PauseAndResume(t *testing.T) {
	rt := setupCombatTestRouter(t)

	pauseReq := httptest.NewRequest(http.MethodPost, "/combat/pause", nil)
	pauseReq.Header.Set("Authorization", "Bearer "+rt.token)
	pauseW := httptest.NewRecorder()
	rt.engine.ServeHTTP(pauseW, pauseReq)
	if pauseW.Code != http.StatusNoContent {
		t.Fatalf("pause expected 204, got %d body=%s", pauseW.Code, pauseW.Body.String())
	}

	statusReq := httptest.NewRequest(http.MethodGet, "/combat/status", nil)
	statusReq.Header.Set("Authorization", "Bearer "+rt.token)
	statusW := httptest.NewRecorder()
	rt.engine.ServeHTTP(statusW, statusReq)
	if statusW.Code != http.StatusOK {
		t.Fatalf("status expected 200, got %d", statusW.Code)
	}
	var status map[string]interface{}
	json.Unmarshal(statusW.Body.Bytes(), &status)
	if status["status"] != model.CombatStatusPaused {
		t.Fatalf("expected paused status, got %v", status["status"])
	}

	resumeReq := httptest.NewRequest(http.MethodPost, "/combat/resume", nil)
	resumeReq.Header.Set("Authorization", "Bearer "+rt.token)
	resumeW := httptest.NewRecorder()
	rt.engine.ServeHTTP(resumeW, resumeReq)
	if resumeW.Code != http.StatusNoContent {
		t.Fatalf("resume expected 204, got %d", resumeW.Code)
	}

	statusReq2 := httptest.NewRequest(http.MethodGet, "/combat/status", nil)
	statusReq2.Header.Set("Authorization", "Bearer "+rt.token)
	statusW2 := httptest.NewRecorder()
	rt.engine.ServeHTTP(statusW2, statusReq2)
	if statusW2.Code != http.StatusOK {
		t.Fatalf("status expected 200, got %d", statusW2.Code)
	}
	json.Unmarshal(statusW2.Body.Bytes(), &status)
	if status["status"] != model.CombatStatusRunning {
		t.Fatalf("expected running status after resume, got %v", status["status"])
	}
}

func TestCombatHandler_DebugTick_returnsEvents(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "1")
	rt := setupCombatTestRouter(t)

	tickReq := httptest.NewRequest(http.MethodPost, "/debug/combat/tick", nil)
	tickReq.Header.Set("Authorization", "Bearer "+rt.token)
	tickW := httptest.NewRecorder()
	rt.engine.ServeHTTP(tickW, tickReq)
	if tickW.Code != http.StatusNoContent {
		t.Fatalf("debug tick expected 204, got %d body=%s", tickW.Code, tickW.Body.String())
	}

	eventsReq := httptest.NewRequest(http.MethodGet, "/combat/events?since=0", nil)
	eventsReq.Header.Set("Authorization", "Bearer "+rt.token)
	eventsW := httptest.NewRecorder()
	rt.engine.ServeHTTP(eventsW, eventsReq)
	if eventsW.Code != http.StatusOK {
		t.Fatalf("events expected 200, got %d", eventsW.Code)
	}
	var body map[string]interface{}
	json.Unmarshal(eventsW.Body.Bytes(), &body)
	events, _ := body["events"].([]interface{})
	if len(events) == 0 {
		t.Fatal("expected combat events after debug tick")
	}
}

func TestCombatHandler_DebugTick_notFoundWithoutE2E(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "")
	rt := setupCombatTestRouter(t)

	tickReq := httptest.NewRequest(http.MethodPost, "/debug/combat/tick", nil)
	tickReq.Header.Set("Authorization", "Bearer "+rt.token)
	tickW := httptest.NewRecorder()
	rt.engine.ServeHTTP(tickW, tickReq)
	if tickW.Code != http.StatusNotFound {
		t.Fatalf("debug tick expected 404 without E2E, got %d", tickW.Code)
	}
}

func TestCombatHandler_ArmOffline_thenDebugTick_updatesSaveStats(t *testing.T) {
	t.Setenv("TEXT_IDLE_E2E", "1")
	rt := setupCombatTestRouter(t)

	armReq := httptest.NewRequest(http.MethodPost, "/combat/arm-offline", nil)
	armReq.Header.Set("Authorization", "Bearer "+rt.token)
	armW := httptest.NewRecorder()
	rt.engine.ServeHTTP(armW, armReq)
	if armW.Code != http.StatusNoContent {
		t.Fatalf("arm-offline expected 204, got %d body=%s", armW.Code, armW.Body.String())
	}

	saveBeforeReq := httptest.NewRequest(http.MethodGet, "/save", nil)
	saveBeforeReq.Header.Set("Authorization", "Bearer "+rt.token)
	saveBeforeW := httptest.NewRecorder()
	rt.engine.ServeHTTP(saveBeforeW, saveBeforeReq)
	var saveBefore map[string]interface{}
	json.Unmarshal(saveBeforeW.Body.Bytes(), &saveBefore)
	statsBefore, _ := saveBefore["playerStats"].(map[string]interface{})
	battlesBefore, _ := statsBefore["battleCount"].(float64)

	tickReq := httptest.NewRequest(http.MethodPost, "/debug/combat/tick", nil)
	tickReq.Header.Set("Authorization", "Bearer "+rt.token)
	tickW := httptest.NewRecorder()
	rt.engine.ServeHTTP(tickW, tickReq)
	if tickW.Code != http.StatusNoContent {
		t.Fatalf("debug tick expected 204, got %d body=%s", tickW.Code, tickW.Body.String())
	}

	saveAfterReq := httptest.NewRequest(http.MethodGet, "/save", nil)
	saveAfterReq.Header.Set("Authorization", "Bearer "+rt.token)
	saveAfterW := httptest.NewRecorder()
	rt.engine.ServeHTTP(saveAfterW, saveAfterReq)
	var saveAfter map[string]interface{}
	json.Unmarshal(saveAfterW.Body.Bytes(), &saveAfter)
	statsAfter, _ := saveAfter["playerStats"].(map[string]interface{})
	battlesAfter, _ := statsAfter["battleCount"].(float64)
	if battlesAfter <= battlesBefore {
		t.Fatalf("expected battleCount increase after arm-offline tick, before=%v after=%v", battlesBefore, battlesAfter)
	}
}
