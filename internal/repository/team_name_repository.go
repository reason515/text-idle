package repository

import (
	"errors"

	"github.com/text-idle/text-idle/internal/model"
	"gorm.io/gorm"
)

var (
	ErrTeamNameTaken   = errors.New("team name already taken")
	ErrTeamNameInvalid = errors.New("team name invalid")
)

type TeamNameRepository struct {
	db *gorm.DB
}

func NewTeamNameRepository(db *gorm.DB) *TeamNameRepository {
	return &TeamNameRepository{db: db}
}

func (r *TeamNameRepository) GetByUserID(userID uint) (*model.TeamNameClaim, error) {
	var row model.TeamNameClaim
	err := r.db.First(&row, userID).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *TeamNameRepository) DeleteByUserID(userID uint) error {
	return r.db.Delete(&model.TeamNameClaim{}, userID).Error
}

// SyncClaim sets or clears the user's team name claim. Empty name clears the claim.
func (r *TeamNameRepository) SyncClaim(userID uint, teamName string) error {
	if teamName == "" {
		return r.db.Where("user_id = ?", userID).Delete(&model.TeamNameClaim{}).Error
	}

	taken, err := r.IsTakenByOtherUser(userID, teamName)
	if err != nil {
		return err
	}
	if taken {
		return ErrTeamNameTaken
	}

	return r.db.Save(&model.TeamNameClaim{UserID: userID, TeamName: teamName}).Error
}

func (r *TeamNameRepository) IsTakenByOtherUser(userID uint, teamName string) (bool, error) {
	if teamName == "" {
		return false, nil
	}
	var existing model.TeamNameClaim
	err := r.db.Where("team_name = ?", teamName).First(&existing).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return existing.UserID != userID, nil
}

// BackfillClaim inserts a claim if the name is free; skips when taken by another user.
func (r *TeamNameRepository) BackfillClaim(userID uint, teamName string) error {
	if teamName == "" {
		return nil
	}
	var existing model.TeamNameClaim
	err := r.db.Where("team_name = ?", teamName).First(&existing).Error
	if err == nil {
		if existing.UserID == userID {
			return nil
		}
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	return r.db.Save(&model.TeamNameClaim{UserID: userID, TeamName: teamName}).Error
}
