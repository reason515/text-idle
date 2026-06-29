package handler

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/service"
)

type SaveHandler struct {
	saveService *service.SaveService
	combatLoop  *service.CombatLoopService
}

func NewSaveHandler(saveService *service.SaveService, combatLoop *service.CombatLoopService) *SaveHandler {
	return &SaveHandler{saveService: saveService, combatLoop: combatLoop}
}

func (h *SaveHandler) Get(c *gin.Context) {
	userID, ok := c.Get(middleware.UserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	uid := userID.(uint)
	data, err := h.saveService.GetSave(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load save"})
		return
	}
	now := time.Now()
	if h.combatLoop != nil {
		_ = h.combatLoop.SyncCombatStateFromSave(uid, data, now)
	}
	var save map[string]interface{}
	if err := json.Unmarshal(data, &save); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid save"})
		return
	}
	if h.combatLoop != nil {
		if state, err := h.combatLoop.GetStatus(uid); err == nil {
			save["combatState"] = map[string]interface{}{
				"status":     state.Status,
				"nextTickAt": state.NextTickAt.UTC().Format(time.RFC3339),
				"lastTickAt": state.LastTickAt.UTC().Format(time.RFC3339),
				"eventSeq":   state.EventSeq,
			}
		}
	}
	out, _ := json.Marshal(save)
	c.Data(http.StatusOK, "application/json", out)
}

func (h *SaveHandler) Put(c *gin.Context) {
	userID, ok := c.Get(middleware.UserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if !json.Valid(body) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}
	uid := userID.(uint)
	if err := h.saveService.PutSave(uid, json.RawMessage(body)); err != nil {
		switch {
		case errors.Is(err, service.ErrTeamNameTaken):
			c.JSON(http.StatusConflict, gin.H{"error": "team name already taken"})
		case errors.Is(err, service.ErrTeamNameInvalid):
			c.JSON(http.StatusBadRequest, gin.H{"error": "team name invalid"})
		case errors.Is(err, service.ErrAuthoritativeFieldChange):
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot modify authoritative save fields"})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}
	h.syncCombatAfterSaveWrite(uid)
	c.Status(http.StatusNoContent)
}

func (h *SaveHandler) Patch(c *gin.Context) {
	userID, ok := c.Get(middleware.UserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if !json.Valid(body) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}
	uid := userID.(uint)
	if err := h.saveService.PatchPlayerSave(uid, json.RawMessage(body)); err != nil {
		switch {
		case errors.Is(err, service.ErrTeamNameTaken):
			c.JSON(http.StatusConflict, gin.H{"error": "team name already taken"})
		case errors.Is(err, service.ErrTeamNameInvalid):
			c.JSON(http.StatusBadRequest, gin.H{"error": "team name invalid"})
		case errors.Is(err, service.ErrAuthoritativeFieldChange):
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot modify authoritative save fields"})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}
	h.syncCombatAfterSaveWrite(uid)
	c.Status(http.StatusNoContent)
}

func (h *SaveHandler) DebugPut(c *gin.Context) {
	if os.Getenv("TEXT_IDLE_E2E") != "1" {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	userID, ok := c.Get(middleware.UserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	if !json.Valid(body) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}
	uid := userID.(uint)
	if err := h.saveService.PutSaveUnrestricted(uid, json.RawMessage(body)); err != nil {
		switch {
		case errors.Is(err, service.ErrTeamNameTaken):
			c.JSON(http.StatusConflict, gin.H{"error": "team name already taken"})
		case errors.Is(err, service.ErrTeamNameInvalid):
			c.JSON(http.StatusBadRequest, gin.H{"error": "team name invalid"})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}
	h.syncCombatAfterSaveWrite(uid)
	c.Status(http.StatusNoContent)
}

func (h *SaveHandler) syncCombatAfterSaveWrite(userID uint) {
	if h.combatLoop == nil {
		return
	}
	data, err := h.saveService.GetSave(userID)
	if err != nil {
		return
	}
	_ = h.combatLoop.SyncCombatStateFromSave(userID, data, time.Now())
}
