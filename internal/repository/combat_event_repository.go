package repository

import (
	"github.com/text-idle/text-idle/internal/model"
	"gorm.io/gorm"
)

type CombatEventRepository struct {
	db *gorm.DB
}

func NewCombatEventRepository(db *gorm.DB) *CombatEventRepository {
	return &CombatEventRepository{db: db}
}

const maxCombatEventsPerUser = 200

func (r *CombatEventRepository) Append(userID uint, seq int64, eventType, payload string) error {
	row := model.CombatEvent{
		UserID:  userID,
		Seq:     seq,
		Type:    eventType,
		Payload: payload,
	}
	if err := r.db.Create(&row).Error; err != nil {
		return err
	}
	var count int64
	if err := r.db.Model(&model.CombatEvent{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return err
	}
	if count <= maxCombatEventsPerUser {
		return nil
	}
	excess := count - maxCombatEventsPerUser
	var ids []uint64
	if err := r.db.Model(&model.CombatEvent{}).
		Where("user_id = ?", userID).
		Order("seq ASC").
		Limit(int(excess)).
		Pluck("id", &ids).Error; err != nil {
		return err
	}
	if len(ids) == 0 {
		return nil
	}
	return r.db.Delete(&model.CombatEvent{}, ids).Error
}

func (r *CombatEventRepository) ListSince(userID uint, sinceSeq int64, limit int) ([]model.CombatEvent, error) {
	if limit <= 0 {
		limit = 100
	}
	var rows []model.CombatEvent
	q := r.db.Where("user_id = ?", userID)
	if sinceSeq > 0 {
		q = q.Where("seq > ?", sinceSeq)
	}
	err := q.Order("seq ASC").Limit(limit).Find(&rows).Error
	return rows, err
}
