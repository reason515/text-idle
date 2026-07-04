package combat

import (
	"encoding/json"
	"fmt"
)

// EconomyResult is the outcome of a server-side shop buy or sell.
type EconomyResult struct {
	Success       bool            `json:"success"`
	Save          json.RawMessage `json:"save,omitempty"`
	Reason        string          `json:"reason,omitempty"`
	Item          json.RawMessage `json:"item,omitempty"`
	InventoryFull bool            `json:"inventoryFull,omitempty"`
	GoldDeducted  int             `json:"goldDeducted,omitempty"`
	GoldGained    int             `json:"goldGained,omitempty"`
}

// BuyShopItem deducts gold and adds a shop item on the authoritative save.
func BuyShopItem(save json.RawMessage, slotID string, rngSeed uint64) (EconomyResult, error) {
	initEngine()
	if engineErr != nil {
		return EconomyResult{}, engineErr
	}
	payload, err := json.Marshal(map[string]interface{}{
		"save":    json.RawMessage(save),
		"slotId":  slotID,
		"rngSeed": rngSeed,
	})
	if err != nil {
		return EconomyResult{}, err
	}
	engineMu.Lock()
	defer engineMu.Unlock()
	outStr, err := buyShopJSON(string(payload))
	if err != nil {
		return EconomyResult{}, fmt.Errorf("shop buy: %w", err)
	}
	return decodeEconomyResult(outStr)
}

// SellItem removes an inventory item and adds gold on the authoritative save.
func SellItem(save json.RawMessage, itemID string) (EconomyResult, error) {
	initEngine()
	if engineErr != nil {
		return EconomyResult{}, engineErr
	}
	payload, err := json.Marshal(map[string]interface{}{
		"save":   json.RawMessage(save),
		"itemId": itemID,
	})
	if err != nil {
		return EconomyResult{}, err
	}
	engineMu.Lock()
	defer engineMu.Unlock()
	outStr, err := sellItemJSON(string(payload))
	if err != nil {
		return EconomyResult{}, fmt.Errorf("shop sell: %w", err)
	}
	return decodeEconomyResult(outStr)
}

func decodeEconomyResult(outStr string) (EconomyResult, error) {
	var raw map[string]interface{}
	if err := json.Unmarshal([]byte(outStr), &raw); err != nil {
		return EconomyResult{}, fmt.Errorf("decode economy result: %w", err)
	}
	result := EconomyResult{
		Success: raw["success"] == true,
	}
	if reason, ok := raw["reason"].(string); ok {
		result.Reason = reason
	}
	if v, ok := raw["inventoryFull"].(bool); ok {
		result.InventoryFull = v
	}
	if v, ok := raw["goldDeducted"].(float64); ok {
		result.GoldDeducted = int(v)
	}
	if v, ok := raw["goldGained"].(float64); ok {
		result.GoldGained = int(v)
	}
	if save, ok := raw["save"]; ok && save != nil {
		b, err := json.Marshal(save)
		if err != nil {
			return EconomyResult{}, err
		}
		result.Save = b
	}
	if item, ok := raw["item"]; ok && item != nil {
		b, err := json.Marshal(item)
		if err != nil {
			return EconomyResult{}, err
		}
		result.Item = b
	}
	return result, nil
}
