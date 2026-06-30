package repository

import (
	"strings"

	"github.com/text-idle/text-idle/internal/model"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(userID uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, userID).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	normalized := strings.ToLower(strings.TrimSpace(email))
	err := r.db.Where("LOWER(TRIM(email)) = ?", normalized).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) ExistsByEmail(email string) (bool, error) {
	var count int64
	normalized := strings.ToLower(strings.TrimSpace(email))
	err := r.db.Model(&model.User{}).Where("LOWER(TRIM(email)) = ?", normalized).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *UserRepository) FindByToken(token string) (*model.User, error) {
	if token == "" {
		return nil, gorm.ErrRecordNotFound
	}
	var user model.User
	err := r.db.Where("token = ?", token).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) UpdateToken(userID uint, token string) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("token", token).Error
}
