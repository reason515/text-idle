package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/service"
)

type LeaderboardHandler struct {
	leaderboardService *service.LeaderboardService
}

func NewLeaderboardHandler(leaderboardService *service.LeaderboardService) *LeaderboardHandler {
	return &LeaderboardHandler{leaderboardService: leaderboardService}
}

func (h *LeaderboardHandler) Get(c *gin.Context) {
	userID, ok := c.Get(middleware.UserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	resp, err := h.leaderboardService.GetLeaderboard(userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load leaderboard"})
		return
	}
	c.JSON(http.StatusOK, resp)
}
