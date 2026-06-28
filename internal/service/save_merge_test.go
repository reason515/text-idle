package service

import (
	"encoding/json"
	"errors"
	"testing"
)

func TestMergePlayerPatch_AllowsSquadAndTeamName(t *testing.T) {
	base := json.RawMessage(`{"teamName":"A","squad":[{"id":"h1"}],"gold":10,"inventory":[],"playerStats":{"displayScaleN":100,"combatActionSteps":5},"combatProgress":{"currentMapId":"elwynn-forest","currentProgress":0}}`)
	patch := json.RawMessage(`{"teamName":"B","squad":[{"id":"h1","level":2}],"playerStats":{"displayScaleN":80}}`)
	out, err := MergePlayerPatch(base, patch)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var m map[string]interface{}
	if err := json.Unmarshal(out, &m); err != nil {
		t.Fatal(err)
	}
	if m["teamName"] != "B" {
		t.Errorf("teamName=%v", m["teamName"])
	}
	if m["gold"].(float64) != 10 {
		t.Errorf("gold changed: %v", m["gold"])
	}
}

func TestMergePlayerPatch_AllowsInventoryChange(t *testing.T) {
	base := json.RawMessage(`{"teamName":"A","squad":[{"id":"h1"}],"gold":10,"inventory":[{"id":"old"}],"playerStats":{"displayScaleN":100},"combatProgress":{"currentMapId":"elwynn-forest","currentProgress":0}}`)
	patch := json.RawMessage(`{"inventory":[{"id":"new"}]}`)
	out, err := MergePlayerPatch(base, patch)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	var m map[string]interface{}
	if err := json.Unmarshal(out, &m); err != nil {
		t.Fatal(err)
	}
	inv, ok := m["inventory"].([]interface{})
	if !ok || len(inv) != 1 {
		t.Fatalf("inventory=%v", m["inventory"])
	}
	item, ok := inv[0].(map[string]interface{})
	if !ok || item["id"] != "new" {
		t.Fatalf("inventory item=%v", inv[0])
	}
}

func TestMergePlayerPatch_RejectsGoldChange(t *testing.T) {
	base := json.RawMessage(`{"gold":10}`)
	patch := json.RawMessage(`{"gold":999}`)
	_, err := MergePlayerPatch(base, patch)
	if !errors.Is(err, ErrAuthoritativeFieldChange) {
		t.Fatalf("expected ErrAuthoritativeFieldChange, got %v", err)
	}
}

func TestMergePlayerPatch_RejectsCombatStepsChange(t *testing.T) {
	base := json.RawMessage(`{"playerStats":{"combatActionSteps":5,"displayScaleN":100}}`)
	patch := json.RawMessage(`{"playerStats":{"combatActionSteps":99,"displayScaleN":100}}`)
	_, err := MergePlayerPatch(base, patch)
	if !errors.Is(err, ErrAuthoritativeFieldChange) {
		t.Fatalf("expected ErrAuthoritativeFieldChange, got %v", err)
	}
}
