package server

import (
	"io/fs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/handler"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/repository"
	"github.com/text-idle/text-idle/internal/service"
	"gorm.io/gorm"
)

// NewRouter creates the application router with all routes and middleware.
// Used by both main.go and E2E tests to ensure identical behavior.
// staticFS: when non-nil (release build), serves embedded frontend; when nil (dev), API only.
func NewRouter(db *gorm.DB, staticFS fs.FS, includeTestUsersInLeaderboard bool) *gin.Engine {
	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)
	saveRepo := repository.NewPlayerSaveRepository(db)
	leaderboardRepo := repository.NewLeaderboardRepository(db)
	teamNameRepo := repository.NewTeamNameRepository(db)
	leaderboardService := service.NewLeaderboardService(leaderboardRepo, saveRepo, userRepo, includeTestUsersInLeaderboard)
	teamNameService := service.NewTeamNameService(teamNameRepo, saveRepo)
	saveService := service.NewSaveService(saveRepo, leaderboardService, teamNameService)
	messageBoardRepo := repository.NewMessageBoardRepository(db)
	messageBoardService := service.NewMessageBoardService(messageBoardRepo, saveService)
	saveHandler := handler.NewSaveHandler(saveService)
	teamNameHandler := handler.NewTeamNameHandler(teamNameService)
	leaderboardHandler := handler.NewLeaderboardHandler(leaderboardService)
	messageBoardHandler := handler.NewMessageBoardHandler(messageBoardService)
	authMw := middleware.AuthRequired(userRepo)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))
	r.GET("/health", func(c *gin.Context) { c.Status(200) })
	r.POST("/register", authHandler.Register)
	r.POST("/login", authHandler.Login)
	r.GET("/save", authMw, saveHandler.Get)
	r.PUT("/save", authMw, saveHandler.Put)
	r.GET("/team-name/check", authMw, teamNameHandler.Check)
	r.GET("/leaderboard", authMw, leaderboardHandler.Get)
	r.GET("/message-board", authMw, messageBoardHandler.Get)
	r.POST("/message-board", authMw, messageBoardHandler.Post)

	if staticFS != nil {
		sub, err := fs.Sub(staticFS, "web")
		if err != nil {
			panic("static fs sub: " + err.Error())
		}
		r.NoRoute(serveSPA(sub))
	}

	return r
}
