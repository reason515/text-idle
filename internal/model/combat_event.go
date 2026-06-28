package model

import "time"

// CombatEvent stores recent combat tick events for REST replay and WS recovery.
type CombatEvent struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint      `gorm:"not null;index:idx_combat_events_user_seq,priority:1" json:"user_id"`
	Seq       int64     `gorm:"not null;index:idx_combat_events_user_seq,priority:2" json:"seq"`
	Type      string    `gorm:"not null" json:"type"`
	Payload   string    `gorm:"type:text;not null" json:"payload"`
	CreatedAt time.Time `gorm:"not null;index" json:"created_at"`
}

// TableName overrides default pluralization.
func (CombatEvent) TableName() string {
	return "combat_events"
}
