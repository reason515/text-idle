package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/service"
)

type TeamNameHandler struct {
	teamNameService *service.TeamNameService
}

func NewTeamNameHandler(teamNameService *service.TeamNameService) *TeamNameHandler {
	return &TeamNameHandler{teamNameService: teamNameService}
}

func (h *TeamNameHandler) Check(c *gin.Context) {
	userID, ok := c.Get(middleware.UserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	name := c.Query("teamName")
	available, err := h.teamNameService.IsAvailable(userID.(uint), name)
	if err != nil {
		switch err {
		case service.ErrTeamNameInvalid:
			c.JSON(http.StatusBadRequest, gin.H{"error": "team name invalid"})
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}
	c.JSON(http.StatusOK, gin.H{"available": available})
}
