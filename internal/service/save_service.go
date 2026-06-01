package service

import (
	"encoding/json"
	"errors"

	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

var ErrSaveNotFound = errors.New("save not found")

type SaveService struct {
	saveRepo *repository.PlayerSaveRepository
}

func NewSaveService(saveRepo *repository.PlayerSaveRepository) *SaveService {
	return &SaveService{saveRepo: saveRepo}
}

func emptySaveJSON() string {
	return `{"teamName":"","squad":[],"combatProgress":{"unlockedMapCount":1,"currentMapId":"elwynn-forest","currentProgress":0,"bossAvailable":false},"gold":0,"inventory":[],"playerStats":{"combatActionSteps":0,"restSteps":0,"cumulativeGold":0,"cumulativeXp":0,"displayScaleN":100,"battleCount":0,"victoryCount":0,"battleTimeline":[],"damageByHero":{}}}`
}

// GetSave returns the raw save JSON for a user, or the default empty save if none exists.
func (s *SaveService) GetSave(userID uint) (json.RawMessage, error) {
	row, err := s.saveRepo.GetByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return json.RawMessage(emptySaveJSON()), nil
		}
		return nil, err
	}
	if row.SaveData == "" {
		return json.RawMessage(emptySaveJSON()), nil
	}
	return json.RawMessage(row.SaveData), nil
}

// PutSave validates and stores save JSON for a user.
func (s *SaveService) PutSave(userID uint, data json.RawMessage) error {
	if !json.Valid(data) {
		return errors.New("invalid json")
	}
	return s.saveRepo.Upsert(userID, string(data))
}
