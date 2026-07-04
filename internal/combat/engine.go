package combat

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"sync"

	"github.com/dop251/goja"
)

//go:embed embed/combat.bundle.js
var combatBundleJS string

var (
	engineOnce sync.Once
	engineMu   sync.Mutex
	engineErr  error
	runJSON    func(input string) (string, error)
)

func initEngine() {
	engineOnce.Do(func() {
		vm := goja.New()
		if _, err := vm.RunString(combatBundleJS); err != nil {
			engineErr = fmt.Errorf("run combat bundle: %w", err)
			return
		}
		global := vm.GlobalObject()
		fn := global.Get("runServerCombatCycleFromJSON")
		if fn == nil {
			engineErr = fmt.Errorf("runServerCombatCycleFromJSON not found in bundle")
			return
		}
		callable, ok := goja.AssertFunction(fn)
		if !ok {
			engineErr = fmt.Errorf("runServerCombatCycleFromJSON is not a function")
			return
		}
		runJSON = func(input string) (string, error) {
			val, err := callable(goja.Undefined(), vm.ToValue(input))
			if err != nil {
				return "", err
			}
			return val.String(), nil
		}
	})
}

// RunCycle executes one server combat cycle via the embedded JS engine.
// nowMs is wall-clock ms for battleTimeline endedAtMs; use 0 to let the bundle default.
func RunCycle(save json.RawMessage, rngSeed uint64, nowMs int64) (CycleResult, error) {
	initEngine()
	if engineErr != nil {
		return CycleResult{}, engineErr
	}
	payload := map[string]interface{}{
		"save":    json.RawMessage(save),
		"rngSeed": rngSeed,
	}
	if nowMs > 0 {
		payload["nowMs"] = nowMs
	}
	input, err := json.Marshal(payload)
	if err != nil {
		return CycleResult{}, err
	}
	engineMu.Lock()
	defer engineMu.Unlock()
	outStr, err := runJSON(string(input))
	if err != nil {
		return CycleResult{}, fmt.Errorf("combat cycle: %w", err)
	}
	var out CycleResult
	if err := json.Unmarshal([]byte(outStr), &out); err != nil {
		return CycleResult{}, fmt.Errorf("decode cycle result: %w", err)
	}
	return out, nil
}
