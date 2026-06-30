package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"

	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailExists        = errors.New("email already exists")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

// NormalizeEmail lowercases and trims email for stable login across clients.
func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func (s *AuthService) Register(email, password string) (string, error) {
	email = NormalizeEmail(email)
	exists, err := s.userRepo.ExistsByEmail(email)
	if err != nil {
		return "", err
	}
	if exists {
		return "", ErrEmailExists
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	token := generateToken()
	user := &model.User{
		Email:    email,
		Password: string(hashed),
		Token:    token,
	}
	if err := s.userRepo.Create(user); err != nil {
		return "", err
	}
	return token, nil
}

func (s *AuthService) Login(email, password string) (string, error) {
	email = NormalizeEmail(email)
	user, err := s.userRepo.FindByEmail(email)
	if err != nil || user == nil {
		return "", ErrInvalidCredentials
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}
	token := generateToken()
	if err := s.userRepo.UpdateToken(user.ID, token); err != nil {
		return "", err
	}
	return token, nil
}

func generateToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return "tok_" + hex.EncodeToString(b)
}
