package model

// TeamNameClaim enforces globally unique non-empty team names for leaderboard display.
type TeamNameClaim struct {
	UserID   uint   `gorm:"primaryKey" json:"-"`
	TeamName string `gorm:"uniqueIndex;not null" json:"team_name"`
}
