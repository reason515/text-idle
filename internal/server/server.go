package server

import (
	"context"
	"io/fs"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/handler"
	"github.com/text-idle/text-idle/internal/middleware"
	"github.com/text-idle/text-idle/internal/repository"
	"github.com/text-idle/text-idle/internal/service"
	"gorm.io/gorm"
)

// App bundles the HTTP router and background combat scheduler.
type App struct {
	Router    *gin.Engine
	Scheduler *service.CombatScheduler
}

// NewApp creates the application router with all routes and combat scheduler.
func NewApp(db *gorm.DB, staticFS fs.FS, includeTestUsersInLeaderboard bool) *App {
	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)
	saveRepo := repository.NewPlayerSaveRepository(db)
	leaderboardRepo := repository.NewLeaderboardRepository(db)
	teamNameRepo := repository.NewTeamNameRepository(db)
	combatStateRepo := repository.NewPlayerCombatStateRepository(db)
	combatEventRepo := repository.NewCombatEventRepository(db)
	leaderboardService := service.NewLeaderboardService(leaderboardRepo, saveRepo, userRepo, includeTestUsersInLeaderboard)
	teamNameService := service.NewTeamNameService(teamNameRepo, saveRepo)
	saveService := service.NewSaveService(saveRepo, leaderboardService, teamNameService)
	combatHub := service.NewCombatHub()
	combatLoop := service.NewCombatLoopService(saveService, combatStateRepo, combatEventRepo, combatHub)
	combatScheduler := service.NewCombatScheduler(combatStateRepo, combatLoop)
	messageBoardRepo := repository.NewMessageBoardRepository(db)
	messageBoardService := service.NewMessageBoardService(messageBoardRepo, saveService)
	saveHandler := handler.NewSaveHandler(saveService, combatLoop)
	teamNameHandler := handler.NewTeamNameHandler(teamNameService)
	leaderboardHandler := handler.NewLeaderboardHandler(leaderboardService)
	messageBoardHandler := handler.NewMessageBoardHandler(messageBoardService)
	combatHandler := handler.NewCombatHandler(combatLoop, saveService, combatEventRepo, combatHub)
	authMw := middleware.AuthRequired(userRepo)
	wsAuthMw := middleware.AuthRequiredQueryOrHeader(userRepo)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))
	r.GET("/health", func(c *gin.Context) { c.Status(200) })
	r.POST("/register", authHandler.Register)
	r.POST("/login", authHandler.Login)
	r.GET("/save", authMw, saveHandler.Get)
	r.PUT("/save", authMw, saveHandler.Put)
	r.PATCH("/save/player", authMw, saveHandler.Patch)
	r.PUT("/debug/save", authMw, saveHandler.DebugPut)
	r.GET("/team-name/check", authMw, teamNameHandler.Check)
	r.GET("/leaderboard", authMw, leaderboardHandler.Get)
	r.GET("/message-board", authMw, messageBoardHandler.Get)
	r.POST("/message-board", authMw, messageBoardHandler.Post)
	r.GET("/combat/status", authMw, combatHandler.Status)
	r.GET("/combat/events", authMw, combatHandler.Events)
	r.POST("/combat/pause", authMw, combatHandler.Pause)
	r.POST("/combat/resume", authMw, combatHandler.Resume)
	r.POST("/combat/advance", authMw, combatHandler.Advance)
	r.POST("/combat/arm-offline", authMw, combatHandler.ArmOffline)
	r.POST("/combat/presence", authMw, combatHandler.Presence)
	r.GET("/combat/ws", wsAuthMw, combatHandler.WebSocket)
	r.POST("/debug/combat/tick", authMw, combatHandler.DebugTick)

	if staticFS != nil {
		sub, err := fs.Sub(staticFS, "web")
		if err != nil {
			panic("static fs sub: " + err.Error())
		}
		r.NoRoute(serveSPA(sub))
	}

	return &App{Router: r, Scheduler: combatScheduler}
}

// NewRouter creates the application router (legacy helper for tests).
func NewRouter(db *gorm.DB, staticFS fs.FS, includeTestUsersInLeaderboard bool) *gin.Engine {
	return NewApp(db, staticFS, includeTestUsersInLeaderboard).Router
}

// StartScheduler runs the combat scheduler until ctx is cancelled.
func (a *App) StartScheduler(ctx context.Context) {
	if a.Scheduler != nil {
		go a.Scheduler.Start(ctx)
	}
}
