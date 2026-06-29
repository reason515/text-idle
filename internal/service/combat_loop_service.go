package service

import (
	"encoding/json"
	"errors"
	"os"
	"time"

	"github.com/text-idle/text-idle/internal/combat"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

const offlineCapHours = 24

// CombatLoopService runs one server combat tick for a user.
type CombatLoopService struct {
	saveService      *SaveService
	combatStateRepo  *repository.PlayerCombatStateRepository
	combatEventRepo  *repository.CombatEventRepository
	hub              *CombatHub
}

func NewCombatLoopService(
	saveService *SaveService,
	combatStateRepo *repository.PlayerCombatStateRepository,
	combatEventRepo *repository.CombatEventRepository,
	hub *CombatHub,
) *CombatLoopService {
	return &CombatLoopService{
		saveService:     saveService,
		combatStateRepo: combatStateRepo,
		combatEventRepo: combatEventRepo,
		hub:             hub,
	}
}

// EnsureCombatState creates or updates combat scheduler state from the current save.
func (s *CombatLoopService) EnsureCombatState(userID uint, save json.RawMessage, now time.Time) error {
	return s.SyncCombatStateFromSave(userID, save, now)
}

// SyncCombatStateFromSave creates combat state when missing and transitions empty_squad
// to running when the player later fills their squad (intro / recruitment).
func (s *CombatLoopService) SyncCombatStateFromSave(userID uint, save json.RawMessage, now time.Time) error {
	state, err := s.combatStateRepo.GetByUserID(userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		status := model.CombatStatusRunning
		if squadEmpty(save) {
			status = model.CombatStatusEmptySquad
		}
		row := &model.PlayerCombatState{
			UserID:        userID,
			Status:        status,
			NextTickAt:    now,
			LastTickAt:    now,
			RngSeed:       uint64(userID)*2654435761 + 1,
			CombatVersion: 1,
			EventSeq:      0,
			UpdatedAt:     now,
		}
		return s.combatStateRepo.Upsert(row)
	}
	if err != nil {
		return err
	}
	return s.syncCombatStatusFromSave(state, save, now)
}

func (s *CombatLoopService) syncCombatStatusFromSave(state *model.PlayerCombatState, save json.RawMessage, now time.Time) error {
	if state.Status == model.CombatStatusPaused {
		return nil
	}
	if squadEmpty(save) {
		if state.Status != model.CombatStatusEmptySquad {
			state.Status = model.CombatStatusEmptySquad
			state.UpdatedAt = now
			return s.combatStateRepo.Upsert(state)
		}
		return nil
	}
	if state.Status == model.CombatStatusEmptySquad {
		state.Status = model.CombatStatusRunning
		state.NextTickAt = now
		state.UpdatedAt = now
		return s.combatStateRepo.Upsert(state)
	}
	return nil
}

func squadEmpty(save json.RawMessage) bool {
	var m map[string]interface{}
	if err := json.Unmarshal(save, &m); err != nil {
		return true
	}
	squad, _ := m["squad"].([]interface{})
	return len(squad) == 0
}

// TickUser executes one combat cycle when due (respects pause and schedule).
func (s *CombatLoopService) TickUser(userID uint, now time.Time) error {
	return s.tickUser(userID, now, true, true)
}

// ForceTickUser runs one cycle immediately (E2E debug); ignores pause and next_tick_at.
func (s *CombatLoopService) ForceTickUser(userID uint, now time.Time) error {
	return s.tickUser(userID, now, false, false)
}

func (s *CombatLoopService) tickUser(userID uint, now time.Time, respectPause, respectSchedule bool) error {
	state, err := s.combatStateRepo.GetByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			save, err := s.saveService.GetSave(userID)
			if err != nil {
				return err
			}
			if err := s.EnsureCombatState(userID, save, now); err != nil {
				return err
			}
			state, err = s.combatStateRepo.GetByUserID(userID)
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}

	if respectPause && state.Status == model.CombatStatusPaused {
		return nil
	}

	save, err := s.saveService.GetSave(userID)
	if err != nil {
		return err
	}
	if squadEmpty(save) {
		if state.Status != model.CombatStatusEmptySquad {
			state.Status = model.CombatStatusEmptySquad
			state.UpdatedAt = now
			return s.combatStateRepo.Upsert(state)
		}
		return nil
	}
	if state.Status == model.CombatStatusEmptySquad {
		state.Status = model.CombatStatusRunning
	}

	capStart := now.Add(-offlineCapHours * time.Hour)
	if state.LastTickAt.Before(capStart) {
		state.LastTickAt = capStart
	}
	if respectSchedule && state.NextTickAt.After(now) {
		return nil
	}

	result, err := combat.RunCycle(save, state.RngSeed)
	if err != nil {
		return err
	}

	if result.Skipped {
		state.Status = model.CombatStatusEmptySquad
		state.UpdatedAt = now
		return s.combatStateRepo.Upsert(state)
	}

	if err := s.saveService.storeSave(userID, result.Save); err != nil {
		return err
	}

	delay := time.Duration(result.NextCycleDelayMs) * time.Millisecond
	if os.Getenv("TEXT_IDLE_E2E") == "1" {
		delay = 200 * time.Millisecond
	} else if delay < time.Second {
		delay = time.Second
	}
	state.LastTickAt = now
	state.NextTickAt = now.Add(delay)
	state.RngSeed = result.NextRngSeed
	state.UpdatedAt = now

	// Emit log batch before cycle_complete so clients show monsters before summary/rest.
	if len(result.Log) > 0 {
		logBatch, err := json.Marshal(map[string]interface{}{
			"type": "combat.log_batch",
			"payload": map[string]interface{}{
				"log": json.RawMessage(result.Log),
			},
		})
		if err != nil {
			return err
		}
		state.EventSeq++
		if err := s.combatEventRepo.Append(userID, state.EventSeq, "combat.log_batch", string(logBatch)); err != nil {
			return err
		}
		if s.hub != nil {
			wsPayload, _ := json.Marshal(WSMessage{
				Seq:   state.EventSeq,
				Type:  "combat.log_batch",
				Event: logBatch,
			})
			s.hub.Broadcast(userID, wsPayload)
		}
	}

	for _, rawEvent := range result.Events {
		var evt map[string]interface{}
		if err := json.Unmarshal(rawEvent, &evt); err != nil {
			continue
		}
		evtType, _ := evt["type"].(string)
		state.EventSeq++
		if err := s.combatEventRepo.Append(userID, state.EventSeq, evtType, string(rawEvent)); err != nil {
			return err
		}
		wsPayload, _ := json.Marshal(WSMessage{
			Seq:   state.EventSeq,
			Type:  evtType,
			Event: rawEvent,
		})
		if s.hub != nil {
			s.hub.Broadcast(userID, wsPayload)
		}
	}

	return s.combatStateRepo.Upsert(state)
}

func (s *CombatLoopService) GetStatus(userID uint) (*model.PlayerCombatState, error) {
	return s.combatStateRepo.GetByUserID(userID)
}

func (s *CombatLoopService) Pause(userID uint, now time.Time) error {
	state, err := s.ensureState(userID, now)
	if err != nil {
		return err
	}
	state.Status = model.CombatStatusPaused
	t := now
	state.PausedAt = &t
	state.UpdatedAt = now
	return s.combatStateRepo.Upsert(state)
}

func (s *CombatLoopService) Resume(userID uint, now time.Time) error {
	state, err := s.ensureState(userID, now)
	if err != nil {
		return err
	}
	state.Status = model.CombatStatusRunning
	state.PausedAt = nil
	state.NextTickAt = now
	state.UpdatedAt = now
	return s.combatStateRepo.Upsert(state)
}

func (s *CombatLoopService) ensureState(userID uint, now time.Time) (*model.PlayerCombatState, error) {
	state, err := s.combatStateRepo.GetByUserID(userID)
	if err == nil {
		return state, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	save, err := s.saveService.GetSave(userID)
	if err != nil {
		return nil, err
	}
	if err := s.EnsureCombatState(userID, save, now); err != nil {
		return nil, err
	}
	return s.combatStateRepo.GetByUserID(userID)
}
