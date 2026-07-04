package combat

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func repoRoot(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	return filepath.Clean(filepath.Join(filepath.Dir(file), "..", ".."))
}

func loadFixture(t *testing.T, name string) map[string]interface{} {
	t.Helper()
	path := filepath.Join(repoRoot(t), "testdata", "combat", name+".json")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read fixture %s: %v", name, err)
	}
	var doc map[string]interface{}
	if err := json.Unmarshal(raw, &doc); err != nil {
		t.Fatalf("parse fixture %s: %v", name, err)
	}
	return doc
}

func TestParity_server_cycle_fixed_trio(t *testing.T) {
	fix := loadFixture(t, "server_cycle_fixed_trio")
	input, _ := fix["input"].(map[string]interface{})
	expected, _ := fix["expected"].(map[string]interface{})
	saveRaw, err := json.Marshal(fix["save"])
	if err != nil {
		t.Fatalf("marshal save: %v", err)
	}

	rngSeed := uint64(1001)
	if input != nil {
		if v, ok := input["rngSeed"].(float64); ok {
			rngSeed = uint64(v)
		}
	}

	result, err := RunCycle(saveRaw, rngSeed, 0)
	if err != nil {
		t.Fatalf("RunCycle: %v", err)
	}
	if result.Skipped {
		t.Fatalf("expected not skipped, reason=%s", result.Reason)
	}
	if expected != nil {
		if want, ok := expected["outcome"].(string); ok && result.Outcome != want {
			t.Errorf("outcome: got %q want %q", result.Outcome, want)
		}
		if want, ok := expected["nextCycleDelayMs"].(float64); ok && result.NextCycleDelayMs != int64(want) {
			t.Errorf("nextCycleDelayMs: got %d want %d", result.NextCycleDelayMs, int64(want))
		}
		var save map[string]interface{}
		if err := json.Unmarshal(result.Save, &save); err != nil {
			t.Fatalf("parse save: %v", err)
		}
		if wantGold, ok := expected["gold"].(float64); ok {
			gotGold, _ := save["gold"].(float64)
			if int(gotGold) != int(wantGold) {
				t.Errorf("gold: got %v want %v", gotGold, wantGold)
			}
		}
		if wantSteps, ok := expected["combatActionSteps"].(float64); ok {
			stats, _ := save["playerStats"].(map[string]interface{})
			gotSteps, _ := stats["combatActionSteps"].(float64)
			if int(gotSteps) != int(wantSteps) {
				t.Errorf("combatActionSteps: got %v want %v", gotSteps, wantSteps)
			}
		}
		if wantEvents, ok := expected["eventCount"].(float64); ok && len(result.Events) != int(wantEvents) {
			t.Errorf("eventCount: got %d want %d", len(result.Events), int(wantEvents))
		}
		if want, ok := expected["stepsLength"].(float64); ok {
			if len(result.Steps) == 0 {
				t.Error("stepsLength expected but CycleResult.Steps is empty")
			} else {
				var steps []interface{}
				if err := json.Unmarshal(result.Steps, &steps); err != nil {
					t.Fatalf("parse steps: %v", err)
				}
				if len(steps) != int(want) {
					t.Errorf("stepsLength: got %d want %d", len(steps), int(want))
				}
			}
		}
		if want, ok := expected["hasEncounter"].(bool); ok && want {
			if len(result.Encounter) == 0 {
				t.Error("hasEncounter expected but CycleResult.Encounter is empty")
			}
		}
	}
}
