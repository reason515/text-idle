package service

import (
	"encoding/json"
	"errors"
	"os"
	"strconv"
	"time"

	"github.com/text-idle/text-idle/internal/combat"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

const offlineCapHours = 24

// clientResumeGateDuration blocks scheduler auto-ticks until the client calls Advance
// after finishing log replay (online display-synced pacing).
const clientResumeGateDuration = 100 * 365 * 24 * time.Hour

const clientPresenceTimeout = 90 * time.Second

const defaultMaxOfflineTicksPerScan = 20

func isAwaitingClientResume(nextTickAt, now time.Time) bool {
	return nextTickAt.Sub(now) > 7*24*time.Hour
}

func maxOfflineTicksPerScanFromEnv() int {
	if v := os.Getenv("COMBAT_MAX_OFFLINE_TICKS_PER_SCAN"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return defaultMaxOfflineTicksPerScan
}

func cycleDelayMs(state *model.PlayerCombatState) int64 {
	delay := state.LastCycleDelayMs
	if delay < 1000 {
		delay = 1000
	}
	return delay
}

func cycleDelay(state *model.PlayerCombatState) time.Duration {
	return time.Duration(cycleDelayMs(state)) * time.Millisecond
}

func wallClockArmed(state *model.PlayerCombatState) bool {
	return !state.OfflineCapUntil.IsZero()
}

func wallClockCapped(state *model.PlayerCombatState, now time.Time) bool {
	if !wallClockArmed(state) {
		return false
	}
	return !now.Before(state.OfflineCapUntil)
}

// CombatLoopService runs one server combat tick for a user.
type CombatLoopService struct {
	saveService     *SaveService
	combatStateRepo *repository.PlayerCombatStateRepository
	combatEventRepo *repository.CombatEventRepository
	hub             *CombatHub
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

func (s *CombatLoopService) isClientGated(state *model.PlayerCombatState, userID uint, now time.Time) bool {
	if os.Getenv("TEXT_IDLE_E2E") == "1" {
		return false
	}
	if s.hub == nil || !s.hub.HasConnection(userID) {
		return false
	}
	if state.LastClientSeenAt.IsZero() {
		return false
	}
	return now.Sub(state.LastClientSeenAt) < clientPresenceTimeout
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
			CombatVersion: 2,
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

// ArmOffline switches the player to wall-clock scheduler mode (tab hidden / browser closed).
func (s *CombatLoopService) ArmOffline(userID uint, now time.Time) error {
	state, err := s.ensureState(userID, now)
	if err != nil {
		return err
	}
	if state.Status == model.CombatStatusPaused {
		return nil
	}
	save, err := s.saveService.GetSave(userID)
	if err != nil {
		return err
	}
	if squadEmpty(save) {
		return nil
	}
	state.OfflineCapUntil = now.Add(offlineCapHours * time.Hour)
	state.LastClientSeenAt = time.Time{}
	delay := cycleDelay(state)
	nextDue := state.LastTickAt.Add(delay)
	if nextDue.Before(now) {
		nextDue = now
	}
	state.NextTickAt = nextDue
	state.UpdatedAt = now
	return s.combatStateRepo.Upsert(state)
}

// RecordPresence marks the client as actively viewing /main (client-gated pacing).
func (s *CombatLoopService) RecordPresence(userID uint, now time.Time) error {
	state, err := s.ensureState(userID, now)
	if err != nil {
		return err
	}
	state.LastClientSeenAt = now
	state.UpdatedAt = now
	return s.combatStateRepo.Upsert(state)
}

// TickUser executes up to maxOfflineTicksPerScan combat cycles when due.
func (s *CombatLoopService) TickUser(userID uint, now time.Time) error {
	maxTicks := maxOfflineTicksPerScanFromEnv()
	for i := 0; i < maxTicks; i++ {
		state, err := s.combatStateRepo.GetByUserID(userID)
		if err != nil {
			return err
		}
		if state.Status == model.CombatStatusPaused || state.Status == model.CombatStatusEmptySquad {
			return nil
		}
		if s.isClientGated(state, userID, now) {
			if state.NextTickAt.After(now) {
				return nil
			}
			return s.tickUser(userID, now, true, true)
		}
		if wallClockCapped(state, now) {
			return nil
		}
		if state.NextTickAt.After(now) {
			return nil
		}
		tickAt := now
		if i > 0 {
			simulated := state.LastTickAt.Add(cycleDelay(state))
			if simulated.Before(now) {
				tickAt = simulated
			}
		}
		if err := s.tickUser(userID, tickAt, true, true); err != nil {
			return err
		}
	}
	return nil
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
		state.NextTickAt = now
		state.UpdatedAt = now
		if err := s.combatStateRepo.Upsert(state); err != nil {
			return err
		}
	}

	clientGated := s.isClientGated(state, userID, now)

	if !clientGated && wallClockCapped(state, now) {
		state.NextTickAt = state.OfflineCapUntil
		state.UpdatedAt = now
		return s.combatStateRepo.Upsert(state)
	}

	if clientGated && respectSchedule {
		schedulableUntil := state.LastTickAt.Add(offlineCapHours * time.Hour)
		if now.After(schedulableUntil) && isAwaitingClientResume(state.NextTickAt, now) {
			state.LastTickAt = now
			state.NextTickAt = now
			state.UpdatedAt = now
			return s.combatStateRepo.Upsert(state)
		}
	}

	if respectSchedule && state.NextTickAt.After(now) {
		return nil
	}

	nowMs := now.UnixMilli()
	result, err := combat.RunCycle(save, state.RngSeed, nowMs)
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
	state.LastCycleDelayMs = int64(delay / time.Millisecond)
	if os.Getenv("TEXT_IDLE_E2E") == "1" {
		state.NextTickAt = now.Add(delay)
	} else if clientGated {
		state.NextTickAt = now.Add(clientResumeGateDuration)
	} else {
		nextDue := now.Add(delay)
		if wallClockArmed(state) && !nextDue.Before(state.OfflineCapUntil) {
			nextDue = state.OfflineCapUntil
		}
		state.NextTickAt = nextDue
	}
	state.RngSeed = result.NextRngSeed
	state.CombatVersion = 2
	state.UpdatedAt = now

	if len(result.Log) > 0 {
		payload := map[string]interface{}{
			"log": json.RawMessage(result.Log),
		}
		if len(result.Encounter) > 0 {
			payload["encounter"] = json.RawMessage(result.Encounter)
		}
		if len(result.Steps) > 0 {
			payload["steps"] = json.RawMessage(result.Steps)
		}
		logBatch, err := json.Marshal(map[string]interface{}{
			"type":    "combat.log_batch",
			"payload": payload,
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
	save, err := s.saveService.GetSave(userID)
	if err != nil {
		return err
	}
	if squadEmpty(save) {
		state.Status = model.CombatStatusEmptySquad
	} else {
		state.Status = model.CombatStatusRunning
	}
	state.PausedAt = nil
	state.UpdatedAt = now
	return s.combatStateRepo.Upsert(state)
}

// Advance runs the next combat cycle after the client finishes displaying the prior one.
func (s *CombatLoopService) Advance(userID uint, now time.Time) error {
	return s.tickUser(userID, now, true, false)
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

// BackfillStuckCombatStates re-syncs combat status and migrates client-gated stuck rows.
func (s *CombatLoopService) BackfillStuckCombatStates(now time.Time) (int, error) {
	rows, err := s.saveService.ListAllSaves()
	if err != nil {
		return 0, err
	}
	synced := 0
	for _, row := range rows {
		if err := s.SyncCombatStateFromSave(row.UserID, json.RawMessage(row.SaveData), now); err != nil {
			return synced, err
		}
		state, err := s.combatStateRepo.GetByUserID(row.UserID)
		if err != nil {
			continue
		}
		if state.Status == model.CombatStatusPaused || state.Status == model.CombatStatusEmptySquad {
			synced++
			continue
		}
		clientConnected := s.hub != nil && s.hub.HasConnection(row.UserID)
		recentPresence := !state.LastClientSeenAt.IsZero() && now.Sub(state.LastClientSeenAt) < clientPresenceTimeout
		if isAwaitingClientResume(state.NextTickAt, now) && !clientConnected && !recentPresence {
			save, err := s.saveService.GetSave(row.UserID)
			if err != nil || squadEmpty(save) {
				synced++
				continue
			}
			state.OfflineCapUntil = now.Add(offlineCapHours * time.Hour)
			state.LastClientSeenAt = time.Time{}
			state.NextTickAt = now
			state.UpdatedAt = now
			if err := s.combatStateRepo.Upsert(state); err != nil {
				return synced, err
			}
		}
		synced++
	}
	return synced, nil
}

// OnClientDisconnected arms wall-clock mode when the last WS drops and presence expired.
func (s *CombatLoopService) OnClientDisconnected(userID uint, now time.Time) error {
	if s.hub != nil && s.hub.HasConnection(userID) {
		return nil
	}
	state, err := s.combatStateRepo.GetByUserID(userID)
	if err != nil {
		return nil
	}
	if !state.LastClientSeenAt.IsZero() && now.Sub(state.LastClientSeenAt) < clientPresenceTimeout {
		return nil
	}
	return s.ArmOffline(userID, now)
}
