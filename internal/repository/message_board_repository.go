package repository

import (
	"github.com/text-idle/text-idle/internal/model"
	"gorm.io/gorm"
)

const (
	MessageBoardDefaultLimit = 100
	MessageBoardMaxLimit     = 200
)

type MessageBoardRepository struct {
	db *gorm.DB
}

func NewMessageBoardRepository(db *gorm.DB) *MessageBoardRepository {
	return &MessageBoardRepository{db: db}
}

func (r *MessageBoardRepository) Create(entry *model.MessageBoardEntry) error {
	return r.db.Create(entry).Error
}

func (r *MessageBoardRepository) ListRecent(limit int, beforeID uint) ([]model.MessageBoardEntry, error) {
	if limit <= 0 {
		limit = MessageBoardDefaultLimit
	}
	if limit > MessageBoardMaxLimit {
		limit = MessageBoardMaxLimit
	}

	var rows []model.MessageBoardEntry
	q := r.db.Order("created_at DESC").Order("id DESC")
	if beforeID > 0 {
		q = q.Where("id < ?", beforeID)
	}
	err := q.Limit(limit).Find(&rows).Error
	return rows, err
}
