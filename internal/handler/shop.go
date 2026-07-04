package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/service"
)

type ShopHandler struct {
	shopService *service.ShopService
}

func NewShopHandler(shopService *service.ShopService) *ShopHandler {
	return &ShopHandler{shopService: shopService}
}

type shopBuyRequest struct {
	SlotID string `json:"slotId"`
}

type shopSellRequest struct {
	ItemID string `json:"itemId"`
}

func (h *ShopHandler) Buy(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	var req shopBuyRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.SlotID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slot"})
		return
	}
	result, err := h.shopService.Buy(userID, req.SlotID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInsufficientGold):
			c.JSON(http.StatusPaymentRequired, gin.H{"error": "insufficient gold"})
		case errors.Is(err, service.ErrShopSlotInvalid):
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid slot"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "shop buy failed"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"item":          json.RawMessage(result.Item),
		"inventoryFull": result.InventoryFull,
		"goldDeducted":  result.GoldDeducted,
	})
}

func (h *ShopHandler) Sell(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	var req shopSellRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.ItemID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid item"})
		return
	}
	result, err := h.shopService.Sell(userID, req.ItemID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrItemNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "shop sell failed"})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"item":       json.RawMessage(result.Item),
		"goldGained": result.GoldGained,
	})
}
