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
	engineOnce      sync.Once
	engineMu        sync.Mutex
	engineErr       error
	runJSON         func(input string) (string, error)
	buyShopJSON     func(input string) (string, error)
	sellItemJSON    func(input string) (string, error)
)

func bindJSONCallable(vm *goja.Runtime, globalName string) (func(input string) (string, error), error) {
	fn := vm.GlobalObject().Get(globalName)
	if fn == nil {
		return nil, fmt.Errorf("%s not found in bundle", globalName)
	}
	callable, ok := goja.AssertFunction(fn)
	if !ok {
		return nil, fmt.Errorf("%s is not a function", globalName)
	}
	return func(input string) (string, error) {
		val, err := callable(goja.Undefined(), vm.ToValue(input))
		if err != nil {
			return "", err
		}
		return val.String(), nil
	}, nil
}

func initEngine() {
	engineOnce.Do(func() {
		vm := goja.New()
		if _, err := vm.RunString(combatBundleJS); err != nil {
			engineErr = fmt.Errorf("run combat bundle: %w", err)
			return
		}
		var err error
		runJSON, err = bindJSONCallable(vm, "runServerCombatCycleFromJSON")
		if err != nil {
			engineErr = err
			return
		}
		buyShopJSON, err = bindJSONCallable(vm, "buyShopItemFromJSON")
		if err != nil {
			engineErr = err
			return
		}
		sellItemJSON, err = bindJSONCallable(vm, "sellItemFromJSON")
		if err != nil {
			engineErr = err
			return
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
