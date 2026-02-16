package e2e

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/server"
	"gorm.io/gorm"
)

func setupE2E(t *testing.T) (*gin.Engine, *gorm.DB) {
	gin.SetMode(gin.TestMode)
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}

	r := server.NewRouter(db)
	return r, db
}

func TestE2E_Register_AC1_ValidRegistration_FullFlow(t *testing.T) {
	r, db := setupE2E(t)

	reqBody := map[string]string{
		"email":    "e2e@example.com",
		"password": "securepass123",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d, body: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Token string `json:"token"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if resp.Token == "" {
		t.Error("expected non-empty token in response")
	}

	var user model.User
	if err := db.Where("email = ?", "e2e@example.com").First(&user).Error; err != nil {
		t.Errorf("expected user in database after registration: %v", err)
	}
	if user.Password == "securepass123" {
		t.Error("password must be hashed, not stored in plaintext")
	}
}

func TestE2E_Register_AC2_DuplicateEmail_ReturnsConflict(t *testing.T) {
	r, db := setupE2E(t)

	db.Create(&model.User{Email: "dup@example.com", Password: "hashed"})

	reqBody := map[string]string{
		"email":    "dup@example.com",
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
		t.Errorf("expected clear error, got: %v", resp["error"])
	}
}

func TestE2E_Register_AC3_ValidationErrors_ReturnBadRequest(t *testing.T) {
	r, _ := setupE2E(t)

	tests := []struct {
		name     string
		email    string
		password string
	}{
		{"invalid email", "not-an-email", "password123"},
		{"weak password", "valid@example.com", "short"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reqBody := map[string]string{"email": tt.email, "password": tt.password}
			body, _ := json.Marshal(reqBody)

			req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			if w.Code != http.StatusBadRequest {
				t.Errorf("expected status 400, got %d, body: %s", w.Code, w.Body.String())
			}
		})
	}
}
