package service

import (
	"encoding/json"
	"errors"
	"fmt"
)

var ErrAuthoritativeFieldChange = errors.New("client cannot modify authoritative save fields")

// MergePlayerPatch applies client-editable fields onto the authoritative save.
// Server-only fields from base are always preserved.
func MergePlayerPatch(base json.RawMessage, patch json.RawMessage) (json.RawMessage, error) {
	if !json.Valid(base) || !json.Valid(patch) {
		return nil, errors.New("invalid json")
	}
	var baseObj map[string]interface{}
	var patchObj map[string]interface{}
	if err := json.Unmarshal(base, &baseObj); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(patch, &patchObj); err != nil {
		return nil, err
	}

	if err := rejectAuthoritativePatchChanges(baseObj, patchObj); err != nil {
		return nil, err
	}

	if v, ok := patchObj["teamName"].(string); ok {
		baseObj["teamName"] = v
	}
	if v, ok := patchObj["squad"]; ok {
		baseObj["squad"] = v
	}
	if v, ok := patchObj["inventory"]; ok {
		baseObj["inventory"] = v
	}
	if cp, ok := patchObj["combatProgress"].(map[string]interface{}); ok {
		baseCP, _ := baseObj["combatProgress"].(map[string]interface{})
		if baseCP == nil {
			baseCP = map[string]interface{}{}
		}
		if mapID, ok := cp["currentMapId"].(string); ok {
			baseCP["currentMapId"] = mapID
		}
		baseObj["combatProgress"] = baseCP
	}
	if ps, ok := patchObj["playerStats"].(map[string]interface{}); ok {
		basePS, _ := baseObj["playerStats"].(map[string]interface{})
		if basePS == nil {
			basePS = map[string]interface{}{}
		}
		if scale, ok := ps["displayScaleN"]; ok {
			basePS["displayScaleN"] = scale
		}
		baseObj["playerStats"] = basePS
	}
	if v, ok := patchObj["pendingExpansionRecruit"]; ok {
		if v == nil {
			delete(baseObj, "pendingExpansionRecruit")
		} else {
			baseObj["pendingExpansionRecruit"] = v
		}
	}

	out, err := json.Marshal(baseObj)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func rejectAuthoritativePatchChanges(base, patch map[string]interface{}) error {
	if patchGold, ok := patch["gold"]; ok {
		if !jsonEqual(base["gold"], patchGold) {
			return fmt.Errorf("%w: gold", ErrAuthoritativeFieldChange)
		}
	}
	if patchTrack, ok := patch["leaderboardTrack"]; ok {
		if !jsonEqual(base["leaderboardTrack"], patchTrack) {
			return fmt.Errorf("%w: leaderboardTrack", ErrAuthoritativeFieldChange)
		}
	}
	if patchPS, ok := patch["playerStats"].(map[string]interface{}); ok {
		basePS, _ := base["playerStats"].(map[string]interface{})
		for _, key := range []string{
			"combatActionSteps", "restSteps", "cumulativeGold", "cumulativeXp",
			"battleCount", "victoryCount", "battleTimeline", "damageByHero", "injuryByHero",
		} {
			if v, ok := patchPS[key]; ok && !jsonEqual(basePS[key], v) {
				return fmt.Errorf("%w: playerStats.%s", ErrAuthoritativeFieldChange, key)
			}
		}
	}
	if patchCP, ok := patch["combatProgress"].(map[string]interface{}); ok {
		baseCP, _ := base["combatProgress"].(map[string]interface{})
		for _, key := range []string{
			"unlockedMapCount", "currentProgress", "bossAvailable",
		} {
			if v, ok := patchCP[key]; ok && !jsonEqual(baseCP[key], v) {
				return fmt.Errorf("%w: combatProgress.%s", ErrAuthoritativeFieldChange, key)
			}
		}
	}
	return nil
}

func jsonEqual(a, b interface{}) bool {
	ja, errA := json.Marshal(a)
	jb, errB := json.Marshal(b)
	if errA != nil || errB != nil {
		return false
	}
	return string(ja) == string(jb)
}
