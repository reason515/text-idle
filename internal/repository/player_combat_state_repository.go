package repository

import (
	"time"

	"github.com/text-idle/text-idle/internal/model"
	"gorm.io/gorm"
)

type PlayerCombatStateRepository struct {
	db *gorm.DB
}

func NewPlayerCombatStateRepository(db *gorm.DB) *PlayerCombatStateRepository {
	return &PlayerCombatStateRepository{db: db}
}

func (r *PlayerCombatStateRepository) GetByUserID(userID uint) (*model.PlayerCombatState, error) {
	var row model.PlayerCombatState
	err := r.db.Where("user_id = ?", userID).First(&row).Error
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *PlayerCombatStateRepository) Upsert(row *model.PlayerCombatState) error {
	return r.db.Save(row).Error
}

// ListDue returns users whose next tick is due, up to limit rows.
func (r *PlayerCombatStateRepository) ListDue(now time.Time, limit int) ([]model.PlayerCombatState, error) {
	if limit <= 0 {
		limit = 50
	}
	var rows []model.PlayerCombatState
	err := r.db.
		Where("status = ? AND next_tick_at <= ?", model.CombatStatusRunning, now).
		Order("next_tick_at ASC").
		Limit(limit).
		Find(&rows).Error
	return rows, err
}

func (r *PlayerCombatStateRepository) EnsureForUser(userID uint, now time.Time) (*model.PlayerCombatState, error) {
	row, err := r.GetByUserID(userID)
	if err == nil {
		return row, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}
	created := &model.PlayerCombatState{
		UserID:        userID,
		Status:        model.CombatStatusRunning,
		NextTickAt:    now,
		LastTickAt:    now,
		RngSeed:       uint64(userID)*2654435761 + 1,
		CombatVersion: 2,
		EventSeq:      0,
		UpdatedAt:     now,
	}
	if err := r.Upsert(created); err != nil {
		return nil, err
	}
	return created, nil
}
