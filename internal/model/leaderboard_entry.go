package model

import "time"

// LeaderboardEntry stores denormalized efficiency stats for ranking queries.
type LeaderboardEntry struct {
	UserID           uint      `gorm:"primaryKey" json:"-"`
	TeamName         string    `gorm:"not null;default:''" json:"team_name"`
	ExplorationSteps int       `gorm:"not null;default:0" json:"exploration_steps"`
	GoldPerStep      float64   `gorm:"not null;default:0" json:"gold_per_step"`
	XpPerStep        float64   `gorm:"not null;default:0" json:"xp_per_step"`
	UpdatedAt        time.Time `json:"updated_at"`
}
