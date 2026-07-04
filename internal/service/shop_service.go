package service

import (
	"encoding/json"
	"errors"
	"math/rand"
	"time"

	"github.com/text-idle/text-idle/internal/combat"
)

// ErrInsufficientGold indicates the player cannot afford the shop item.
var ErrInsufficientGold = errors.New("insufficient gold")

// ErrItemNotFound indicates the sell target is not in the inventory.
var ErrItemNotFound = errors.New("item not found")

// ErrShopSlotInvalid indicates the requested shop slot cannot generate an item.
var ErrShopSlotInvalid = errors.New("invalid shop slot")

// ShopService applies server-authoritative shop buy / sell on the player save.
type ShopService struct {
	saveService *SaveService
	combatLoop  *CombatLoopService
}

func NewShopService(saveService *SaveService, combatLoop *CombatLoopService) *ShopService {
	return &ShopService{saveService: saveService, combatLoop: combatLoop}
}

// BuyResult is the handler-facing outcome of a shop purchase.
type BuyResult struct {
	Item          json.RawMessage
	InventoryFull bool
	GoldDeducted  int
}

// Buy deducts gold and adds a generated item to the authoritative save.
func (s *ShopService) Buy(userID uint, slotID string) (BuyResult, error) {
	save, err := s.saveService.GetSave(userID)
	if err != nil {
		return BuyResult{}, err
	}
	rngSeed := uint64(rand.Int63()) + 1
	result, err := combat.BuyShopItem(save, slotID, rngSeed)
	if err != nil {
		return BuyResult{}, err
	}
	if !result.Success {
		switch result.Reason {
		case "insufficient_gold":
			return BuyResult{}, ErrInsufficientGold
		case "invalid_slot":
			return BuyResult{}, ErrShopSlotInvalid
		default:
			return BuyResult{}, errors.New("shop buy failed")
		}
	}
	if err := s.saveService.ApplyAuthoritativeSave(userID, result.Save); err != nil {
		return BuyResult{}, err
	}
	s.syncCombat(userID, result.Save)
	return BuyResult{
		Item:          result.Item,
		InventoryFull: result.InventoryFull,
		GoldDeducted:  result.GoldDeducted,
	}, nil
}

// SellResult is the handler-facing outcome of a sell.
type SellResult struct {
	Item       json.RawMessage
	GoldGained int
}

// Sell removes an inventory item and adds gold to the authoritative save.
func (s *ShopService) Sell(userID uint, itemID string) (SellResult, error) {
	save, err := s.saveService.GetSave(userID)
	if err != nil {
		return SellResult{}, err
	}
	result, err := combat.SellItem(save, itemID)
	if err != nil {
		return SellResult{}, err
	}
	if !result.Success {
		if result.Reason == "not_found" {
			return SellResult{}, ErrItemNotFound
		}
		return SellResult{}, errors.New("shop sell failed")
	}
	if err := s.saveService.ApplyAuthoritativeSave(userID, result.Save); err != nil {
		return SellResult{}, err
	}
	s.syncCombat(userID, result.Save)
	return SellResult{Item: result.Item, GoldGained: result.GoldGained}, nil
}

func (s *ShopService) syncCombat(userID uint, save json.RawMessage) {
	if s.combatLoop == nil {
		return
	}
	_ = s.combatLoop.SyncCombatStateFromSave(userID, save, time.Now())
}
