package model

import "time"

// PlayerSave stores per-account game progress as JSON (see frontend playerSave.js).
type PlayerSave struct {
	UserID    uint      `gorm:"primaryKey" json:"-"`
	SaveData  string    `gorm:"type:text;not null;default:'{}'" json:"-"`
	UpdatedAt time.Time `json:"updated_at"`
}
