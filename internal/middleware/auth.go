package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/repository"
)

const UserIDKey = "userID"

func AuthRequired(userRepo *repository.UserRepository) gin.HandlerFunc {
	return authFromToken(userRepo, func(c *gin.Context) string {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			return ""
		}
		return strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
	})
}

// AuthRequiredQueryOrHeader accepts JWT from Authorization header or ?token= query (WebSocket).
func AuthRequiredQueryOrHeader(userRepo *repository.UserRepository) gin.HandlerFunc {
	return authFromToken(userRepo, func(c *gin.Context) string {
		auth := c.GetHeader("Authorization")
		if auth != "" && strings.HasPrefix(auth, "Bearer ") {
			return strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))
		}
		return strings.TrimSpace(c.Query("token"))
	})
}

func authFromToken(userRepo *repository.UserRepository, getToken func(*gin.Context) string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := getToken(c)
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid authorization"})
			c.Abort()
			return
		}
		user, err := userRepo.FindByToken(token)
		if err != nil || user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}
		c.Set(UserIDKey, user.ID)
		c.Next()
	}
}
