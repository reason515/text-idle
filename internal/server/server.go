package server

import (
	"io/fs"
	"net/http"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/text-idle/text-idle/internal/handler"
	"github.com/text-idle/text-idle/internal/repository"
	"github.com/text-idle/text-idle/internal/service"
	"gorm.io/gorm"
)

// NewRouter creates the application router with all routes and middleware.
// Used by both main.go and E2E tests to ensure identical behavior.
// staticFS: when non-nil (release build), serves embedded frontend; when nil (dev), API only.
func NewRouter(db *gorm.DB, staticFS fs.FS) *gin.Engine {
	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)

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

	if staticFS != nil {
		sub, err := fs.Sub(staticFS, "web")
		if err != nil {
			panic("static fs sub: " + err.Error())
		}
		r.NoRoute(serveSPA(sub))
	}

	return r
}

// serveSPA serves static files; falls back to index.html for SPA client-side routing.
// Uses http.ServeFileFS to avoid redirect loop (FileFromFS redirects index.html -> /).
func serveSPA(fsys fs.FS) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := strings.TrimPrefix(c.Request.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		f, err := fsys.Open(path)
		if err == nil {
			defer f.Close()
			stat, err := f.Stat()
			if err == nil && !stat.IsDir() {
				http.ServeFileFS(c.Writer, c.Request, fsys, path)
				return
			}
		}
		// SPA fallback: serve index.html (no redirect)
		http.ServeFileFS(c.Writer, c.Request, fsys, "index.html")
	}
}
