package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"github.com/text-idle/text-idle/internal/service"
	"gorm.io/gorm"
)

func setupSaveTestRouter(t *testing.T) (*gin.Engine, string) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.LeaderboardEntry{}, &model.TeamNameClaim{}, &model.PlayerCombatState{}, &model.CombatEvent{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := NewAuthHandler(authService)
	saveRepo := repository.NewPlayerSaveRepository(db)
	leaderboardRepo := repository.NewLeaderboardRepository(db)
	teamNameRepo := repository.NewTeamNameRepository(db)
	leaderboardService := service.NewLeaderboardService(leaderboardRepo, saveRepo, userRepo, true)
	teamNameService := service.NewTeamNameService(teamNameRepo, saveRepo)
	saveService := service.NewSaveService(saveRepo, leaderboardService, teamNameService)
	combatStateRepo := repository.NewPlayerCombatStateRepository(db)
	combatEventRepo := repository.NewCombatEventRepository(db)
	combatHub := service.NewCombatHub()
	combatLoop := service.NewCombatLoopService(saveService, combatStateRepo, combatEventRepo, combatHub)
	saveHandler := NewSaveHandler(saveService, combatLoop)
	authMw := middleware.AuthRequired(userRepo)

	r := gin.New()
	r.POST("/register", authHandler.Register)
	r.GET("/save", authMw, saveHandler.Get)
	r.PUT("/save", authMw, saveHandler.Put)

	regBody, _ := json.Marshal(map[string]string{"email": "save@example.com", "password": "password123"})
	regReq := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(regBody))
	regReq.Header.Set("Content-Type", "application/json")
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("setup register failed: %d %s", regW.Code, regW.Body.String())
	}
	var regResp RegisterResponse
	json.Unmarshal(regW.Body.Bytes(), &regResp)
	return r, regResp.Token
}

func TestSave_GetWithoutToken_ReturnsUnauthorized(t *testing.T) {
	r, _ := setupSaveTestRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/save", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestSave_GetWithToken_ReturnsDefaultSave(t *testing.T) {
	r, token := setupSaveTestRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/save", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}
	var save map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &save); err != nil {
		t.Fatalf("invalid json: %v", err)
	}
	if save["gold"].(float64) != 0 {
		t.Errorf("expected gold 0, got %v", save["gold"])
	}
	combatState, ok := save["combatState"].(map[string]interface{})
	if !ok {
		t.Fatal("expected combatState on GET /save")
	}
	if combatState["status"] != model.CombatStatusEmptySquad {
		t.Errorf("expected empty_squad for default save, got %v", combatState["status"])
	}
}

func TestSave_GetWithFilledSquad_embedsRunningCombatState(t *testing.T) {
	r, token := setupSaveTestRouter(t)
	fixPath := filepath.Join("..", "..", "testdata", "combat", "server_cycle_fixed_trio.json")
	raw, err := os.ReadFile(fixPath)
	if err != nil {
		t.Fatal(err)
	}
	var fix map[string]json.RawMessage
	if err := json.Unmarshal(raw, &fix); err != nil {
		t.Fatal(err)
	}
	putReq := httptest.NewRequest(http.MethodPut, "/save", bytes.NewReader(fix["save"]))
	putReq.Header.Set("Content-Type", "application/json")
	putReq.Header.Set("Authorization", "Bearer "+token)
	putW := httptest.NewRecorder()
	r.ServeHTTP(putW, putReq)
	if putW.Code != http.StatusNoContent {
		t.Fatalf("put expected 204, got %d body=%s", putW.Code, putW.Body.String())
	}

	getReq := httptest.NewRequest(http.MethodGet, "/save", nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getW := httptest.NewRecorder()
	r.ServeHTTP(getW, getReq)
	if getW.Code != http.StatusOK {
		t.Fatalf("get expected 200, got %d", getW.Code)
	}
	var save map[string]interface{}
	if err := json.Unmarshal(getW.Body.Bytes(), &save); err != nil {
		t.Fatal(err)
	}
	combatState, ok := save["combatState"].(map[string]interface{})
	if !ok {
		t.Fatal("expected combatState on GET /save")
	}
	if combatState["status"] != model.CombatStatusRunning {
		t.Errorf("expected running after filled squad, got %v", combatState["status"])
	}
	if combatState["eventSeq"] == nil {
		t.Error("expected eventSeq in combatState")
	}
}

func TestSave_PutAndGet_PersistsData(t *testing.T) {
	r, token := setupSaveTestRouter(t)
	payload := map[string]interface{}{
		"teamName": "Test Squad",
		"squad":    []interface{}{},
		"combatProgress": map[string]interface{}{
			"unlockedMapCount": 1,
			"currentMapId":     "elwynn-forest",
			"currentProgress":  0,
			"bossAvailable":    false,
		},
		"gold":      100,
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
	}
	body, _ := json.Marshal(payload)

	putReq := httptest.NewRequest(http.MethodPut, "/save", bytes.NewReader(body))
	putReq.Header.Set("Content-Type", "application/json")
	putReq.Header.Set("Authorization", "Bearer "+token)
	putW := httptest.NewRecorder()
	r.ServeHTTP(putW, putReq)
	if putW.Code != http.StatusNoContent {
		t.Fatalf("put expected 204, got %d body=%s", putW.Code, putW.Body.String())
	}

	getReq := httptest.NewRequest(http.MethodGet, "/save", nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getW := httptest.NewRecorder()
	r.ServeHTTP(getW, getReq)
	if getW.Code != http.StatusOK {
		t.Fatalf("get expected 200, got %d", getW.Code)
	}
	var loaded map[string]interface{}
	json.Unmarshal(getW.Body.Bytes(), &loaded)
	if loaded["teamName"] != "Test Squad" {
		t.Errorf("expected teamName Test Squad, got %v", loaded["teamName"])
	}
	if loaded["gold"].(float64) != 100 {
		t.Errorf("expected gold 100, got %v", loaded["gold"])
	}
}

func TestSave_InvalidToken_ReturnsUnauthorized(t *testing.T) {
	r, _ := setupSaveTestRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/save", nil)
	req.Header.Set("Authorization", "Bearer tok_invalid")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestSave_DuplicateTeamName_ReturnsConflict(t *testing.T) {
	r, token := setupSaveTestRouter(t)
	payload := map[string]interface{}{
		"teamName": "Taken Squad",
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
		},
	}
	body, _ := json.Marshal(payload)

	reg2, _ := json.Marshal(map[string]string{"email": "other@example.com", "password": "password123"})
	regReq := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(reg2))
	regReq.Header.Set("Content-Type", "application/json")
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("register second user failed: %d", regW.Code)
	}
	var regResp RegisterResponse
	json.Unmarshal(regW.Body.Bytes(), &regResp)

	putReq := httptest.NewRequest(http.MethodPut, "/save", bytes.NewReader(body))
	putReq.Header.Set("Content-Type", "application/json")
	putReq.Header.Set("Authorization", "Bearer "+token)
	putW := httptest.NewRecorder()
	r.ServeHTTP(putW, putReq)
	if putW.Code != http.StatusNoContent {
		t.Fatalf("first put expected 204, got %d", putW.Code)
	}

	putReq2 := httptest.NewRequest(http.MethodPut, "/save", bytes.NewReader(body))
	putReq2.Header.Set("Content-Type", "application/json")
	putReq2.Header.Set("Authorization", "Bearer "+regResp.Token)
	putW2 := httptest.NewRecorder()
	r.ServeHTTP(putW2, putReq2)
	if putW2.Code != http.StatusConflict {
		t.Fatalf("duplicate team name expected 409, got %d body=%s", putW2.Code, putW2.Body.String())
	}
}
