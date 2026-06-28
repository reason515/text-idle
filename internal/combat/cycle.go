package combat

import "encoding/json"

// CycleResult mirrors runServerCombatCycle output from serverCombatCycle.js.
type CycleResult struct {
	Save            json.RawMessage   `json:"save"`
	Skipped         bool              `json:"skipped"`
	Reason          string            `json:"reason,omitempty"`
	Outcome         string            `json:"outcome,omitempty"`
	NextCycleDelayMs int64            `json:"nextCycleDelayMs"`
	Events          []json.RawMessage `json:"events"`
	Log             json.RawMessage   `json:"log,omitempty"`
	NextRngSeed     uint64            `json:"nextRngSeed"`
}
