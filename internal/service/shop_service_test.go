package service

import (
	"encoding/json"
	"testing"

	"github.com/text-idle/text-idle/internal/combat"
)

func TestShopService_BuyAndSellGold(t *testing.T) {
	if testing.Short() {
		t.Skip("combat bundle")
	}
	save := json.RawMessage(`{
		"teamName":"shop-test",
		"squad":[{"id":"h1","level":5}],
		"gold":10000,
		"inventory":[],
		"combatProgress":{"currentMapId":"elwynn-forest"},
		"playerStats":{"displayScaleN":100}
	}`)
	buyResult, err := combat.BuyShopItem(save, "Helm", 42)
	if err != nil {
		t.Fatalf("BuyShopItem: %v", err)
	}
	if !buyResult.Success {
		t.Fatalf("expected success, reason=%s", buyResult.Reason)
	}
	var afterBuy map[string]interface{}
	if err := json.Unmarshal(buyResult.Save, &afterBuy); err != nil {
		t.Fatalf("unmarshal save: %v", err)
	}
	goldAfterBuy, _ := afterBuy["gold"].(float64)
	if goldAfterBuy >= 10000 {
		t.Fatalf("expected gold deducted, got %v", goldAfterBuy)
	}
	inv, _ := afterBuy["inventory"].([]interface{})
	if len(inv) != 1 {
		t.Fatalf("expected 1 inventory item, got %d", len(inv))
	}
	itemRaw, err := json.Marshal(inv[0])
	if err != nil {
		t.Fatalf("marshal item: %v", err)
	}
	var item map[string]interface{}
	if err := json.Unmarshal(itemRaw, &item); err != nil {
		t.Fatalf("unmarshal item: %v", err)
	}
	itemID, _ := item["id"].(string)
	if itemID == "" {
		t.Fatal("expected item id")
	}
	sellResult, err := combat.SellItem(buyResult.Save, itemID)
	if err != nil {
		t.Fatalf("SellItem: %v", err)
	}
	if !sellResult.Success {
		t.Fatalf("expected sell success, reason=%s", sellResult.Reason)
	}
	var afterSell map[string]interface{}
	if err := json.Unmarshal(sellResult.Save, &afterSell); err != nil {
		t.Fatalf("unmarshal after sell: %v", err)
	}
	goldAfterSell, _ := afterSell["gold"].(float64)
	if goldAfterSell <= goldAfterBuy {
		t.Fatalf("expected gold after sell > after buy, buy=%v sell=%v", goldAfterBuy, goldAfterSell)
	}
	invAfter, _ := afterSell["inventory"].([]interface{})
	if len(invAfter) != 0 {
		t.Fatalf("expected empty inventory after sell, got %d", len(invAfter))
	}
}

func TestShopService_BuyInsufficientGold(t *testing.T) {
	if testing.Short() {
		t.Skip("combat bundle")
	}
	save := json.RawMessage(`{"gold":0,"squad":[{"level":1}],"inventory":[]}`)
	result, err := combat.BuyShopItem(save, "Helm", 1)
	if err != nil {
		t.Fatalf("BuyShopItem: %v", err)
	}
	if result.Success {
		t.Fatal("expected insufficient gold failure")
	}
	if result.Reason != "insufficient_gold" {
		t.Fatalf("reason: %s", result.Reason)
	}
}
