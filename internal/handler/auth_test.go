package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"github.com/text-idle/text-idle/internal/service"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func setupTestRouter(t *testing.T) (*gin.Engine, *gorm.DB) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := NewAuthHandler(authService)

	r := gin.New()
	r.POST("/register", authHandler.Register)

	return r, db
}

func TestRegister_AC1_ValidEmailAndPassword_CreatesAccountAndReturnsToken(t *testing.T) {
	r, db := setupTestRouter(t)

	reqBody := map[string]string{
		"email":    "test@example.com",
		"password": "password123",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp RegisterResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if resp.Token == "" {
		t.Error("expected non-empty token")
	}
	if len(resp.Token) < 10 {
		t.Errorf("expected token length >= 10, got %d", len(resp.Token))
	}

	var user model.User
	if err := db.Where("email = ?", "test@example.com").First(&user).Error; err != nil {
		t.Errorf("expected user in db, got error: %v", err)
	}
	if user.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", user.Email)
	}
}

func TestRegister_AC2_EmailAlreadyExists_ReturnsConflictError(t *testing.T) {
	r, db := setupTestRouter(t)

	// Pre-create user with same email
	db.Create(&model.User{Email: "existing@example.com", Password: "hashed"})

	reqBody := map[string]string{
		"email":    "existing@example.com",
		"password": "password123",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusConflict {
		t.Errorf("expected status 409, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp map[string]string
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["error"] != "email already exists" {
		t.Errorf("expected clear error message, got: %v", resp["error"])
	}
}

func TestRegister_AC3_InvalidEmail_ReturnsValidationError(t *testing.T) {
	r, _ := setupTestRouter(t)

	reqBody := map[string]string{
		"email":    "invalid-email",
		"password": "password123",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d, body: %s", w.Code, w.Body.String())
	}
}

func TestRegister_AC3_WeakPassword_ReturnsValidationError(t *testing.T) {
	r, _ := setupTestRouter(t)

	reqBody := map[string]string{
		"email":    "valid@example.com",
		"password": "short",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d, body: %s", w.Code, w.Body.String())
	}
}
