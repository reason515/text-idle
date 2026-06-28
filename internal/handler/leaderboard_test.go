package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"github.com/text-idle/text-idle/internal/service"
	"gorm.io/gorm"
)

func setupLeaderboardTestRouter(t *testing.T) (*gin.Engine, string) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.LeaderboardEntry{}, &model.TeamNameClaim{}); err != nil {
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
	saveHandler := NewSaveHandler(saveService, nil)
	leaderboardHandler := NewLeaderboardHandler(leaderboardService)
	authMw := middleware.AuthRequired(userRepo)

	r := gin.New()
	r.POST("/register", authHandler.Register)
	r.PUT("/save", authMw, saveHandler.Put)
	r.GET("/leaderboard", authMw, leaderboardHandler.Get)

	regBody, _ := json.Marshal(map[string]string{"email": "lb@example.com", "password": "password123"})
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

func TestLeaderboard_GetWithoutToken_ReturnsUnauthorized(t *testing.T) {
	r, _ := setupLeaderboardTestRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/leaderboard", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestLeaderboard_PutSaveThenGet_ReturnsSelfEligible(t *testing.T) {
	r, token := setupLeaderboardTestRouter(t)
	payload := map[string]interface{}{
		"teamName": "Rank Squad",
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
			"combatActionSteps": 1000,
			"restSteps":         0,
			"cumulativeGold":    5000,
			"cumulativeXp":      200,
			"displayScaleN":     100,
			"battleCount":       0,
			"victoryCount":      0,
			"battleTimeline":    []interface{}{},
			"damageByHero":      map[string]interface{}{},
		},
		"leaderboardTrack": map[string]interface{}{
			"lifetimeSteps": 1000,
			"segments": []interface{}{
				map[string]interface{}{"steps": 1000, "gold": 5000, "xp": 200},
			},
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

	getReq := httptest.NewRequest(http.MethodGet, "/leaderboard", nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getW := httptest.NewRecorder()
	r.ServeHTTP(getW, getReq)
	if getW.Code != http.StatusOK {
		t.Fatalf("get expected 200, got %d body=%s", getW.Code, getW.Body.String())
	}

	var resp service.LeaderboardResponse
	if err := json.Unmarshal(getW.Body.Bytes(), &resp); err != nil {
		t.Fatalf("parse: %v", err)
	}
	if !resp.Self.Eligible {
		t.Fatalf("expected eligible self: %+v", resp.Self)
	}
	if resp.Self.GoldRank != 1 || resp.Self.GoldPer100Steps != 500 {
		t.Fatalf("unexpected self: %+v", resp.Self)
	}
	if len(resp.GoldTop10) != 1 || resp.GoldTop10[0].TeamName != "Rank Squad" {
		t.Fatalf("gold top10: %+v", resp.GoldTop10)
	}
}
