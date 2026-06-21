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

func setupTeamNameCheckRouter(t *testing.T) (*gin.Engine, string) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.TeamNameClaim{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := NewAuthHandler(authService)
	saveRepo := repository.NewPlayerSaveRepository(db)
	teamNameRepo := repository.NewTeamNameRepository(db)
	teamNameService := service.NewTeamNameService(teamNameRepo, saveRepo)
	teamNameHandler := NewTeamNameHandler(teamNameService)
	authMw := middleware.AuthRequired(userRepo)

	r := gin.New()
	r.POST("/register", authHandler.Register)
	r.GET("/team-name/check", authMw, teamNameHandler.Check)

	reg1, _ := json.Marshal(map[string]string{"email": "a@example.com", "password": "password123"})
	regReq := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(reg1))
	regReq.Header.Set("Content-Type", "application/json")
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)

	reg2, _ := json.Marshal(map[string]string{"email": "b@example.com", "password": "password123"})
	regReq2 := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(reg2))
	regReq2.Header.Set("Content-Type", "application/json")
	regW2 := httptest.NewRecorder()
	r.ServeHTTP(regW2, regReq2)
	var regResp2 RegisterResponse
	json.Unmarshal(regW2.Body.Bytes(), &regResp2)

	if err := teamNameRepo.SyncClaim(1, "Alpha Squad"); err != nil {
		t.Fatalf("claim: %v", err)
	}

	return r, regResp2.Token
}

func TestTeamNameCheck_TakenName_ReturnsUnavailable(t *testing.T) {
	r, token := setupTeamNameCheckRouter(t)
	req := httptest.NewRequest(http.MethodGet, "/team-name/check?teamName=Alpha%20Squad", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", w.Code, w.Body.String())
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["available"] != false {
		t.Fatalf("expected available false, got %v", resp["available"])
	}
}
