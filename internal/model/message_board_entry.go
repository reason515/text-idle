package model

import "time"

// MessageBoardEntry stores a permanent player message on the global message board.
type MessageBoardEntry struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"-"`
	TeamName  string    `gorm:"not null;default:''" json:"team_name"`
	Content   string    `gorm:"not null" json:"content"`
	CreatedAt time.Time `gorm:"not null;index" json:"created_at"`
}
