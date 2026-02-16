package e2e

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestE2E_Login_AC1_CorrectCredentials_ReturnsToken(t *testing.T) {
	r, _ := setupE2E(t)

	// Register user first
	regBody, _ := json.Marshal(map[string]string{"email": "login-e2e@example.com", "password": "securepass123"})
	regReq := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(regBody))
	regReq.Header.Set("Content-Type", "application/json")
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("setup: register failed with %d", regW.Code)
	}

	// Login with correct credentials
	reqBody := map[string]string{
		"email":    "login-e2e@example.com",
		"password": "securepass123",
	}
	body, _ := json.Marshal(reqBody)

	req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d, body: %s", w.Code, w.Body.String())
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
}

func TestE2E_Login_AC2_WrongCredentials_ReturnsUnauthorized(t *testing.T) {
	r, _ := setupE2E(t)

	// Register user first
	regBody, _ := json.Marshal(map[string]string{"email": "wrong-e2e@example.com", "password": "password123"})
	regReq := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(regBody))
	regReq.Header.Set("Content-Type", "application/json")
	regW := httptest.NewRecorder()
	r.ServeHTTP(regW, regReq)
	if regW.Code != http.StatusCreated {
		t.Fatalf("setup: register failed with %d", regW.Code)
	}

	tests := []struct {
		name     string
		email    string
		password string
	}{
		{"wrong email", "nonexistent@example.com", "password123"},
		{"wrong password", "wrong-e2e@example.com", "wrongpassword"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			reqBody := map[string]string{"email": tt.email, "password": tt.password}
			body, _ := json.Marshal(reqBody)

			req := httptest.NewRequest(http.MethodPost, "/login", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			r.ServeHTTP(w, req)

			if w.Code != http.StatusUnauthorized {
				t.Errorf("expected status 401, got %d, body: %s", w.Code, w.Body.String())
			}

			var resp map[string]string
			json.Unmarshal(w.Body.Bytes(), &resp)
			if resp["error"] != "invalid email or password" {
				t.Errorf("expected clear error, got: %v", resp["error"])
			}
		})
	}
}
