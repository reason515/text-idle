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

func setupMessageBoardTestRouter(t *testing.T) (*gin.Engine, string) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.LeaderboardEntry{}, &model.TeamNameClaim{}, &model.MessageBoardEntry{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := NewAuthHandler(authService)
	saveRepo := repository.NewPlayerSaveRepository(db)
	leaderboardRepo := repository.NewLeaderboardRepository(db)
	teamNameRepo := repository.NewTeamNameRepository(db)
	messageBoardRepo := repository.NewMessageBoardRepository(db)
	leaderboardService := service.NewLeaderboardService(leaderboardRepo, saveRepo, userRepo, true)
	teamNameService := service.NewTeamNameService(teamNameRepo, saveRepo)
	saveService := service.NewSaveService(saveRepo, leaderboardService, teamNameService)
	messageBoardService := service.NewMessageBoardService(messageBoardRepo, saveService)
	saveHandler := NewSaveHandler(saveService)
	messageBoardHandler := NewMessageBoardHandler(messageBoardService)
	authMw := middleware.AuthRequired(userRepo)

	r := gin.New()
	r.POST("/register", authHandler.Register)
	r.PUT("/save", authMw, saveHandler.Put)
	r.GET("/message-board", authMw, messageBoardHandler.Get)
	r.POST("/message-board", authMw, messageBoardHandler.Post)

	regBody, _ := json.Marshal(map[string]string{"email": "mb@example.com", "password": "password123"})
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

func putSaveWithTeamName(t *testing.T, r *gin.Engine, token, teamName string) {
	t.Helper()
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
}

func TestMessageBoard_GetWithoutToken_ReturnsUnauthorized(t *testing.T) {
	r, _ := setupMessageBoardTestRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/message-board", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", w.Code)
	}
}

func TestMessageBoard_PostThenGet_ReturnsMessageWithTeamName(t *testing.T) {
	r, token := setupMessageBoardTestRouter(t)
	putSaveWithTeamName(t, r, token, "Board Squad")

	postBody, _ := json.Marshal(map[string]string{"content": "Hello from the board"})
	postReq := httptest.NewRequest(http.MethodPost, "/message-board", bytes.NewReader(postBody))
	postReq.Header.Set("Content-Type", "application/json")
	postReq.Header.Set("Authorization", "Bearer "+token)
	postW := httptest.NewRecorder()
	r.ServeHTTP(postW, postReq)
	if postW.Code != http.StatusCreated {
		t.Fatalf("post expected 201, got %d body=%s", postW.Code, postW.Body.String())
	}

	var posted service.MessageBoardItem
	if err := json.Unmarshal(postW.Body.Bytes(), &posted); err != nil {
		t.Fatalf("parse post: %v", err)
	}
	if posted.TeamName != "Board Squad" || posted.Content != "Hello from the board" || !posted.IsSelf {
		t.Fatalf("unexpected post item: %+v", posted)
	}
	if posted.CreatedAt.IsZero() {
		t.Fatalf("expected created_at on post response")
	}

	getReq := httptest.NewRequest(http.MethodGet, "/message-board", nil)
	getReq.Header.Set("Authorization", "Bearer "+token)
	getW := httptest.NewRecorder()
	r.ServeHTTP(getW, getReq)
	if getW.Code != http.StatusOK {
		t.Fatalf("get expected 200, got %d body=%s", getW.Code, getW.Body.String())
	}

	var list service.MessageBoardListResponse
	if err := json.Unmarshal(getW.Body.Bytes(), &list); err != nil {
		t.Fatalf("parse list: %v", err)
	}
	if len(list.Messages) != 1 {
		t.Fatalf("expected 1 message, got %+v", list.Messages)
	}
	if list.Messages[0].TeamName != "Board Squad" || list.Messages[0].Content != "Hello from the board" {
		t.Fatalf("unexpected list item: %+v", list.Messages[0])
	}
}

func TestMessageBoard_PostEmptyContent_ReturnsBadRequest(t *testing.T) {
	r, token := setupMessageBoardTestRouter(t)
	postBody, _ := json.Marshal(map[string]string{"content": "   "})
	postReq := httptest.NewRequest(http.MethodPost, "/message-board", bytes.NewReader(postBody))
	postReq.Header.Set("Content-Type", "application/json")
	postReq.Header.Set("Authorization", "Bearer "+token)
	postW := httptest.NewRecorder()
	r.ServeHTTP(postW, postReq)
	if postW.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d body=%s", postW.Code, postW.Body.String())
	}
}
