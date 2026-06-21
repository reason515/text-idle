package service

import (
	"encoding/json"
	"errors"
	"math"
	"path/filepath"
	"strings"
	"time"

	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

const (
	LeaderboardMinExplorationSteps = LeaderboardMinLifetimeSteps
	LeaderboardDisplayScaleN       = 100
)

type LeaderboardService struct {
	leaderboardRepo  *repository.LeaderboardRepository
	saveRepo         *repository.PlayerSaveRepository
	userRepo         *repository.UserRepository
	includeTestUsers bool
}

func NewLeaderboardService(
	leaderboardRepo *repository.LeaderboardRepository,
	saveRepo *repository.PlayerSaveRepository,
	userRepo *repository.UserRepository,
	includeTestUsers bool,
) *LeaderboardService {
	return &LeaderboardService{
		leaderboardRepo:  leaderboardRepo,
		saveRepo:         saveRepo,
		userRepo:         userRepo,
		includeTestUsers: includeTestUsers,
	}
}

// LeaderboardIncludeTestUsers enables test-account rows when using the E2E database.
func LeaderboardIncludeTestUsers(dbPath string) bool {
	base := strings.ToLower(filepath.Base(dbPath))
	return strings.Contains(base, "e2e")
}

type savePayload struct {
	TeamName    string          `json:"teamName"`
	PlayerStats json.RawMessage `json:"playerStats"`
}

type playerStatsPayload struct {
	CombatActionSteps int     `json:"combatActionSteps"`
	RestSteps         int     `json:"restSteps"`
	CumulativeGold    float64 `json:"cumulativeGold"`
	CumulativeXp      float64 `json:"cumulativeXp"`
}

func defaultTeamName(name string) string {
	return name
}

func parseLeaderboardEntry(userID uint, saveJSON json.RawMessage) (*model.LeaderboardEntry, error) {
	var payload savePayload
	if err := json.Unmarshal(saveJSON, &payload); err != nil {
		return nil, err
	}
	track, _, err := parseLeaderboardTrackFromSave(saveJSON)
	if err != nil {
		return nil, err
	}
	if track.LifetimeSteps < LeaderboardMinLifetimeSteps {
		return nil, nil
	}
	_, windowGold, windowXp := windowTotals(track)
	return &model.LeaderboardEntry{
		UserID:           userID,
		TeamName:         defaultTeamName(payload.TeamName),
		ExplorationSteps: track.LifetimeSteps,
		GoldPerStep:      windowGold / float64(LeaderboardWindowSteps),
		XpPerStep:        windowXp / float64(LeaderboardWindowSteps),
		UpdatedAt:        time.Now().UTC(),
	}, nil
}

func (s *LeaderboardService) PurgeTestUserEntries() error {
	if s.includeTestUsers {
		return nil
	}
	return s.leaderboardRepo.DeleteTestUserEntries()
}

func (s *LeaderboardService) shouldSkipTestUser(userID uint) (bool, error) {
	if s.includeTestUsers || s.userRepo == nil {
		return false, nil
	}
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return model.IsE2ETestEmail(user.Email), nil
}

func (s *LeaderboardService) UpsertFromSaveJSON(userID uint, saveJSON json.RawMessage) error {
	skip, err := s.shouldSkipTestUser(userID)
	if err != nil {
		return err
	}
	if skip {
		return s.leaderboardRepo.DeleteByUserID(userID)
	}
	entry, err := parseLeaderboardEntry(userID, saveJSON)
	if err != nil {
		return err
	}
	if entry == nil {
		return s.leaderboardRepo.DeleteByUserID(userID)
	}
	return s.leaderboardRepo.Upsert(entry)
}

func (s *LeaderboardService) BackfillAll() error {
	saves, err := s.saveRepo.ListAll()
	if err != nil {
		return err
	}
	for _, row := range saves {
		if row.SaveData == "" {
			continue
		}
		skip, err := s.shouldSkipTestUser(row.UserID)
		if err != nil {
			return err
		}
		if skip {
			if err := s.leaderboardRepo.DeleteByUserID(row.UserID); err != nil {
				return err
			}
			continue
		}
		if err := s.UpsertFromSaveJSON(row.UserID, json.RawMessage(row.SaveData)); err != nil {
			return err
		}
	}
	return nil
}

type LeaderboardRow struct {
	Rank              int     `json:"rank"`
	TeamName          string  `json:"team_name"`
	ValuePer100Steps  float64 `json:"value_per_100_steps"`
	ExplorationSteps  int     `json:"exploration_steps"`
	IsSelf            bool    `json:"is_self"`
}

type LeaderboardSelf struct {
	GoldRank         int     `json:"gold_rank"`
	XpRank           int     `json:"xp_rank"`
	GoldPer100Steps  float64 `json:"gold_per_100_steps"`
	XpPer100Steps    float64 `json:"xp_per_100_steps"`
	ExplorationSteps int     `json:"exploration_steps"`
	TeamName         string  `json:"team_name"`
	Eligible         bool    `json:"eligible"`
}

type LeaderboardResponse struct {
	GoldTop10 []LeaderboardRow `json:"gold_top10"`
	XpTop10   []LeaderboardRow `json:"xp_top10"`
	Self      LeaderboardSelf  `json:"self"`
}

func roundDisplay(v float64) float64 {
	return math.Round(v*100) / 100
}

func toRow(entry model.LeaderboardEntry, rank int, selfUserID uint, valuePerStep float64) LeaderboardRow {
	return LeaderboardRow{
		Rank:             rank,
		TeamName:         entry.TeamName,
		ValuePer100Steps: roundDisplay(valuePerStep * LeaderboardDisplayScaleN),
		ExplorationSteps: entry.ExplorationSteps,
		IsSelf:           entry.UserID == selfUserID,
	}
}

func (s *LeaderboardService) GetLeaderboard(selfUserID uint) (*LeaderboardResponse, error) {
	goldRows, err := s.leaderboardRepo.Top10Gold(s.includeTestUsers)
	if err != nil {
		return nil, err
	}
	xpRows, err := s.leaderboardRepo.Top10Xp(s.includeTestUsers)
	if err != nil {
		return nil, err
	}

	goldTop10 := make([]LeaderboardRow, 0, len(goldRows))
	for i, row := range goldRows {
		goldTop10 = append(goldTop10, toRow(row, i+1, selfUserID, row.GoldPerStep))
	}
	xpTop10 := make([]LeaderboardRow, 0, len(xpRows))
	for i, row := range xpRows {
		xpTop10 = append(xpTop10, toRow(row, i+1, selfUserID, row.XpPerStep))
	}

	selfEntry, err := s.leaderboardRepo.GetByUserID(selfUserID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	self := LeaderboardSelf{Eligible: false}
	if selfEntry != nil && selfEntry.ExplorationSteps >= LeaderboardMinLifetimeSteps {
		self.Eligible = true
		self.TeamName = selfEntry.TeamName
		self.ExplorationSteps = selfEntry.ExplorationSteps
		self.GoldPer100Steps = roundDisplay(selfEntry.GoldPerStep * LeaderboardDisplayScaleN)
		self.XpPer100Steps = roundDisplay(selfEntry.XpPerStep * LeaderboardDisplayScaleN)

		goldAbove, err := s.leaderboardRepo.CountRankedAboveGold(selfEntry, s.includeTestUsers)
		if err != nil {
			return nil, err
		}
		self.GoldRank = int(goldAbove) + 1

		xpAbove, err := s.leaderboardRepo.CountRankedAboveXp(selfEntry, s.includeTestUsers)
		if err != nil {
			return nil, err
		}
		self.XpRank = int(xpAbove) + 1
	}

	return &LeaderboardResponse{
		GoldTop10: goldTop10,
		XpTop10:   xpTop10,
		Self:      self,
	}, nil
}
