package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"

	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailExists = errors.New("email already exists")
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

func (s *AuthService) Register(email, password string) (string, error) {
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

	user := &model.User{
		Email:    email,
		Password: string(hashed),
	}
	if err := s.userRepo.Create(user); err != nil {
		return "", err
	}

	token := generateToken()
	return token, nil
}

func generateToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return "tok_" + hex.EncodeToString(b)
}
