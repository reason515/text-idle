package repository

import (
	"github.com/text-idle/text-idle/internal/model"
	"gorm.io/gorm"
)

type LeaderboardRepository struct {
	db *gorm.DB
}

func NewLeaderboardRepository(db *gorm.DB) *LeaderboardRepository {
	return &LeaderboardRepository{db: db}
}

func (r *LeaderboardRepository) Upsert(entry *model.LeaderboardEntry) error {
	return r.db.Save(entry).Error
}

func (r *LeaderboardRepository) DeleteByUserID(userID uint) error {
	return r.db.Delete(&model.LeaderboardEntry{}, userID).Error
}

func (r *LeaderboardRepository) GetByUserID(userID uint) (*model.LeaderboardEntry, error) {
	var entry model.LeaderboardEntry
	err := r.db.First(&entry, userID).Error
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

const minExplorationSteps = 1000

const testUserEmailPattern = "%@example.com"

func excludeTestUserEntries(db *gorm.DB) *gorm.DB {
	return db.Where(`user_id NOT IN (
		SELECT id FROM users WHERE email LIKE ? AND deleted_at IS NULL
	)`, testUserEmailPattern)
}

func goldOrder(db *gorm.DB) *gorm.DB {
	return db.Order("gold_per_step DESC").Order("exploration_steps DESC").Order("updated_at ASC")
}

func xpOrder(db *gorm.DB) *gorm.DB {
	return db.Order("xp_per_step DESC").Order("exploration_steps DESC").Order("updated_at ASC")
}

func (r *LeaderboardRepository) Top10Gold(includeTestUsers bool) ([]model.LeaderboardEntry, error) {
	var rows []model.LeaderboardEntry
	q := goldOrder(r.db).Where("exploration_steps >= ?", minExplorationSteps)
	if !includeTestUsers {
		q = excludeTestUserEntries(q)
	}
	err := q.Limit(10).Find(&rows).Error
	return rows, err
}

func (r *LeaderboardRepository) Top10Xp(includeTestUsers bool) ([]model.LeaderboardEntry, error) {
	var rows []model.LeaderboardEntry
	q := xpOrder(r.db).Where("exploration_steps >= ?", minExplorationSteps)
	if !includeTestUsers {
		q = excludeTestUserEntries(q)
	}
	err := q.Limit(10).Find(&rows).Error
	return rows, err
}

func (r *LeaderboardRepository) DeleteTestUserEntries() error {
	return r.db.Exec(`
		DELETE FROM leaderboard_entries
		WHERE user_id IN (
			SELECT id FROM users WHERE email LIKE ? AND deleted_at IS NULL
		)`, testUserEmailPattern).Error
}

func (r *LeaderboardRepository) CountRankedAboveGold(entry *model.LeaderboardEntry, includeTestUsers bool) (int64, error) {
	if entry == nil || entry.ExplorationSteps < minExplorationSteps {
		return 0, nil
	}
	var count int64
	q := r.db.Model(&model.LeaderboardEntry{}).
		Where("exploration_steps >= ?", minExplorationSteps).
		Where(
			"gold_per_step > ? OR (gold_per_step = ? AND exploration_steps > ?) OR (gold_per_step = ? AND exploration_steps = ? AND updated_at < ?)",
			entry.GoldPerStep, entry.GoldPerStep, entry.ExplorationSteps,
			entry.GoldPerStep, entry.ExplorationSteps, entry.UpdatedAt,
		)
	if !includeTestUsers {
		q = excludeTestUserEntries(q)
	}
	err := q.Count(&count).Error
	return count, err
}

func (r *LeaderboardRepository) CountRankedAboveXp(entry *model.LeaderboardEntry, includeTestUsers bool) (int64, error) {
	if entry == nil || entry.ExplorationSteps < minExplorationSteps {
		return 0, nil
	}
	var count int64
	q := r.db.Model(&model.LeaderboardEntry{}).
		Where("exploration_steps >= ?", minExplorationSteps).
		Where(
			"xp_per_step > ? OR (xp_per_step = ? AND exploration_steps > ?) OR (xp_per_step = ? AND exploration_steps = ? AND updated_at < ?)",
			entry.XpPerStep, entry.XpPerStep, entry.ExplorationSteps,
			entry.XpPerStep, entry.ExplorationSteps, entry.UpdatedAt,
		)
	if !includeTestUsers {
		q = excludeTestUserEntries(q)
	}
	err := q.Count(&count).Error
	return count, err
}
