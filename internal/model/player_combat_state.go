package model

import "time"

// Combat scheduler status values for PlayerCombatState.Status.
const (
	CombatStatusRunning    = "running"
	CombatStatusPaused     = "paused"
	CombatStatusEmptySquad = "empty_squad"
)

// PlayerCombatState tracks server-side idle combat scheduling per user.
type PlayerCombatState struct {
	UserID           uint       `gorm:"primaryKey" json:"user_id"`
	Status           string     `gorm:"not null;default:running" json:"status"`
	NextTickAt       time.Time  `gorm:"not null;index" json:"next_tick_at"`
	LastTickAt       time.Time  `gorm:"not null" json:"last_tick_at"`
	LastCycleDelayMs int64      `gorm:"not null;default:1000" json:"last_cycle_delay_ms"`
	RngSeed          uint64     `gorm:"not null;default:0" json:"rng_seed"`
	CombatVersion    int        `gorm:"not null;default:1" json:"combat_version"`
	PausedAt         *time.Time `json:"paused_at,omitempty"`
	PendingExpansion *string    `gorm:"type:text" json:"pending_expansion,omitempty"`
	EventSeq         int64      `gorm:"not null;default:0" json:"event_seq"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// TableName overrides default pluralization.
func (PlayerCombatState) TableName() string {
	return "player_combat_states"
}
