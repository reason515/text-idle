package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/service"
)

type MessageBoardHandler struct {
	messageBoardService *service.MessageBoardService
}

func NewMessageBoardHandler(messageBoardService *service.MessageBoardService) *MessageBoardHandler {
	return &MessageBoardHandler{messageBoardService: messageBoardService}
}

type postMessageBoardRequest struct {
	Content string `json:"content"`
}

func (h *MessageBoardHandler) Get(c *gin.Context) {
	userID, ok := c.Get(middleware.UserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	limit := 0
	if raw := c.Query("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			limit = parsed
		}
	}
	beforeID := uint(0)
	if raw := c.Query("before_id"); raw != "" {
		if parsed, err := strconv.ParseUint(raw, 10, 64); err == nil {
			beforeID = uint(parsed)
		}
	}

	resp, err := h.messageBoardService.ListMessages(userID.(uint), limit, beforeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load message board"})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *MessageBoardHandler) Post(c *gin.Context) {
	userID, ok := c.Get(middleware.UserIDKey)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req postMessageBoardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	item, err := h.messageBoardService.PostMessage(userID.(uint), req.Content)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrMessageBoardEmpty):
			c.JSON(http.StatusBadRequest, gin.H{"error": "message content is empty"})
		case errors.Is(err, service.ErrMessageBoardTooLong):
			c.JSON(http.StatusBadRequest, gin.H{"error": "message content is too long"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to post message"})
		}
		return
	}
	c.JSON(http.StatusCreated, item)
}
