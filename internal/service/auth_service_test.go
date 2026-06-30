package service

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

func setupAuthServiceTestDB(t *testing.T) (*AuthService, *gorm.DB) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	if err := db.AutoMigrate(&model.User{}); err != nil {
		t.Fatal(err)
	}
	repo := repository.NewUserRepository(db)
	return NewAuthService(repo), db
}

func TestNormalizeEmail(t *testing.T) {
	if got := NormalizeEmail("  User@Example.COM  "); got != "user@example.com" {
		t.Fatalf("NormalizeEmail() = %q, want user@example.com", got)
	}
}

func TestAuthService_Login_caseInsensitiveEmail(t *testing.T) {
	svc, _ := setupAuthServiceTestDB(t)
	if _, err := svc.Register("Player@Example.com", "password123"); err != nil {
		t.Fatal(err)
	}
	token, err := svc.Login("player@example.com", "password123")
	if err != nil {
		t.Fatalf("Login with lowercase email failed: %v", err)
	}
	if token == "" {
		t.Fatal("expected token")
	}
}

func TestAuthService_Register_duplicateEmailDifferentCase(t *testing.T) {
	svc, _ := setupAuthServiceTestDB(t)
	if _, err := svc.Register("Player@Example.com", "password123"); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Register("player@example.com", "password456"); err != ErrEmailExists {
		t.Fatalf("expected ErrEmailExists, got %v", err)
	}
}
