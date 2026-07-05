package handler

import (
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/repository"
	"github.com/text-idle/text-idle/internal/service"
)

type CombatHandler struct {
	loopService     *service.CombatLoopService
	saveService     *service.SaveService
	combatEventRepo *repository.CombatEventRepository
	hub             *service.CombatHub
}

func NewCombatHandler(
	loopService *service.CombatLoopService,
	saveService *service.SaveService,
	combatEventRepo *repository.CombatEventRepository,
	hub *service.CombatHub,
) *CombatHandler {
	return &CombatHandler{
		loopService:     loopService,
		saveService:     saveService,
		combatEventRepo: combatEventRepo,
		hub:             hub,
	}
}

var combatUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (h *CombatHandler) Status(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	now := time.Now()
	save, _ := h.saveService.GetSave(userID)
	_ = h.loopService.SyncCombatStateFromSave(userID, save, now)
	state, err := h.loopService.GetStatus(userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "running", "nextTickAt": now.UTC().Format(time.RFC3339)})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"status":     state.Status,
		"nextTickAt": state.NextTickAt.UTC().Format(time.RFC3339),
		"lastTickAt": state.LastTickAt.UTC().Format(time.RFC3339),
		"eventSeq":   state.EventSeq,
	})
}

func (h *CombatHandler) Events(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	since, _ := strconv.ParseInt(c.Query("since"), 10, 64)
	rows, err := h.combatEventRepo.ListSince(userID, since, 100)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load events"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"events": rows})
}

func (h *CombatHandler) Pause(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	if err := h.loopService.Pause(userID, time.Now()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *CombatHandler) Resume(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	if err := h.loopService.Resume(userID, time.Now()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *CombatHandler) Advance(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	if err := h.loopService.Advance(userID, time.Now()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *CombatHandler) ArmOffline(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	if err := h.loopService.ArmOffline(userID, time.Now()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *CombatHandler) Presence(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	if err := h.loopService.RecordPresence(userID, time.Now()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *CombatHandler) WebSocket(c *gin.Context) {
	userID := c.GetUint(middleware.UserIDKey)
	conn, err := combatUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	h.hub.Register(userID, conn)
	h.loopService.OnClientConnected(userID)
	defer func() {
		h.hub.Unregister(userID, conn)
		_ = h.loopService.OnClientDisconnected(userID, time.Now())
		conn.Close()
	}()
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			return
		}
	}
}

func (h *CombatHandler) DebugTick(c *gin.Context) {
	if os.Getenv("TEXT_IDLE_E2E") != "1" {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	userID := c.GetUint(middleware.UserIDKey)
	if err := h.loopService.ForceTickUser(userID, time.Now()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
