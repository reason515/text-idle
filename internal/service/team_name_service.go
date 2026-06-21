package service

import (
	"encoding/json"
	"strings"
	"unicode/utf8"

	"github.com/text-idle/text-idle/internal/repository"
)

var (
	ErrTeamNameTaken   = repository.ErrTeamNameTaken
	ErrTeamNameInvalid = repository.ErrTeamNameInvalid
)

type TeamNameService struct {
	teamNameRepo *repository.TeamNameRepository
	saveRepo     *repository.PlayerSaveRepository
}

func NewTeamNameService(teamNameRepo *repository.TeamNameRepository, saveRepo *repository.PlayerSaveRepository) *TeamNameService {
	return &TeamNameService{
		teamNameRepo: teamNameRepo,
		saveRepo:     saveRepo,
	}
}

func normalizeTeamName(raw string) string {
	return strings.TrimSpace(raw)
}

func validateTeamName(name string) error {
	if name == "" {
		return nil
	}
	length := utf8.RuneCountInString(name)
	if length < 2 || length > 20 {
		return ErrTeamNameInvalid
	}
	return nil
}

func extractTeamNameFromSaveJSON(data json.RawMessage) (string, error) {
	var payload struct {
		TeamName string `json:"teamName"`
	}
	if err := json.Unmarshal(data, &payload); err != nil {
		return "", err
	}
	return normalizeTeamName(payload.TeamName), nil
}

func (s *TeamNameService) ValidateAndSyncClaim(userID uint, data json.RawMessage) error {
	name, err := extractTeamNameFromSaveJSON(data)
	if err != nil {
		return err
	}
	if err := validateTeamName(name); err != nil {
		return err
	}
	return s.teamNameRepo.SyncClaim(userID, name)
}

func (s *TeamNameService) IsAvailable(userID uint, rawName string) (bool, error) {
	name := normalizeTeamName(rawName)
	if err := validateTeamName(name); err != nil {
		return false, err
	}
	if name == "" {
		return true, nil
	}
	existing, err := s.teamNameRepo.GetByUserID(userID)
	if err == nil && existing.TeamName == name {
		return true, nil
	}
	taken, err := s.teamNameRepo.IsTakenByOtherUser(userID, name)
	if err != nil {
		return false, err
	}
	return !taken, nil
}

func (s *TeamNameService) BackfillAll() error {
	saves, err := s.saveRepo.ListAll()
	if err != nil {
		return err
	}
	for _, row := range saves {
		if row.SaveData == "" {
			continue
		}
		name, err := extractTeamNameFromSaveJSON(json.RawMessage(row.SaveData))
		if err != nil {
			return err
		}
		if err := s.teamNameRepo.BackfillClaim(row.UserID, name); err != nil {
			return err
		}
	}
	return nil
}
