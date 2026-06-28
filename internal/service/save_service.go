package service

import (
	"encoding/json"
	"errors"

	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

var ErrSaveNotFound = errors.New("save not found")

type SaveService struct {
	saveRepo           *repository.PlayerSaveRepository
	leaderboardService *LeaderboardService
	teamNameService    *TeamNameService
}

func NewSaveService(
	saveRepo *repository.PlayerSaveRepository,
	leaderboardService *LeaderboardService,
	teamNameService *TeamNameService,
) *SaveService {
	return &SaveService{
		saveRepo:           saveRepo,
		leaderboardService: leaderboardService,
		teamNameService:    teamNameService,
	}
}

func emptySaveJSON() string {
	return `{"teamName":"","squad":[],"combatProgress":{"unlockedMapCount":1,"currentMapId":"elwynn-forest","currentProgress":0,"bossAvailable":false},"gold":0,"inventory":[],"playerStats":{"combatActionSteps":0,"restSteps":0,"cumulativeGold":0,"cumulativeXp":0,"displayScaleN":100,"battleCount":0,"victoryCount":0,"battleTimeline":[],"damageByHero":{}}}`
}

// GetSave returns the raw save JSON for a user, or the default empty save if none exists.
func (s *SaveService) GetSave(userID uint) (json.RawMessage, error) {
	row, err := s.saveRepo.GetByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return json.RawMessage(emptySaveJSON()), nil
		}
		return nil, err
	}
	if row.SaveData == "" {
		return json.RawMessage(emptySaveJSON()), nil
	}
	return json.RawMessage(row.SaveData), nil
}

// PutSave validates and stores save JSON for a user.
// When a non-empty save already exists, authoritative fields must not change from the client.
func (s *SaveService) PutSave(userID uint, data json.RawMessage) error {
	if !json.Valid(data) {
		return errors.New("invalid json")
	}
	existing, err := s.GetSave(userID)
	if err != nil {
		return err
	}
	if !isEmptySaveJSON(existing) {
		if err := rejectAuthoritativePut(existing, data); err != nil {
			return err
		}
	}
	return s.storeSave(userID, data)
}

// PatchPlayerSave merges client-editable fields onto the authoritative save.
func (s *SaveService) PatchPlayerSave(userID uint, patch json.RawMessage) error {
	if !json.Valid(patch) {
		return errors.New("invalid json")
	}
	base, err := s.GetSave(userID)
	if err != nil {
		return err
	}
	merged, err := MergePlayerPatch(base, patch)
	if err != nil {
		return err
	}
	return s.storeSave(userID, merged)
}

// PutSaveUnrestricted stores save JSON without authoritative-field checks (E2E debug only).
func (s *SaveService) PutSaveUnrestricted(userID uint, data json.RawMessage) error {
	if !json.Valid(data) {
		return errors.New("invalid json")
	}
	return s.storeSave(userID, data)
}

func (s *SaveService) storeSave(userID uint, data json.RawMessage) error {
	if s.teamNameService != nil {
		if err := s.teamNameService.ValidateAndSyncClaim(userID, data); err != nil {
			return err
		}
	}
	if err := s.saveRepo.Upsert(userID, string(data)); err != nil {
		return err
	}
	if s.leaderboardService != nil {
		if err := s.leaderboardService.UpsertFromSaveJSON(userID, data); err != nil {
			return err
		}
	}
	return nil
}

func isEmptySaveJSON(data json.RawMessage) bool {
	var m map[string]interface{}
	if err := json.Unmarshal(data, &m); err != nil {
		return true
	}
	team, _ := m["teamName"].(string)
	squad, _ := m["squad"].([]interface{})
	gold, _ := m["gold"].(float64)
	return team == "" && len(squad) == 0 && gold == 0
}

func rejectAuthoritativePut(existing, incoming json.RawMessage) error {
	var base map[string]interface{}
	var patch map[string]interface{}
	if err := json.Unmarshal(existing, &base); err != nil {
		return err
	}
	if err := json.Unmarshal(incoming, &patch); err != nil {
		return err
	}
	return rejectAuthoritativePatchChanges(base, patch)
}
