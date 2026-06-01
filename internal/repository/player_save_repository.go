package repository

import (
	"github.com/text-idle/text-idle/internal/model"
	"gorm.io/gorm"
)

type PlayerSaveRepository struct {
	db *gorm.DB
}

func NewPlayerSaveRepository(db *gorm.DB) *PlayerSaveRepository {
	return &PlayerSaveRepository{db: db}
}

func (r *PlayerSaveRepository) GetByUserID(userID uint) (*model.PlayerSave, error) {
	var save model.PlayerSave
	err := r.db.Where("user_id = ?", userID).First(&save).Error
	if err != nil {
		return nil, err
	}
	return &save, nil
}

func (r *PlayerSaveRepository) Upsert(userID uint, saveData string) error {
	row := model.PlayerSave{
		UserID:   userID,
		SaveData: saveData,
	}
	return r.db.Save(&row).Error
}
