package main

import (
	"flag"
	"io/fs"
	"log"
	"os"

	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"github.com/text-idle/text-idle/internal/server"
	"github.com/text-idle/text-idle/internal/service"
	"github.com/text-idle/text-idle/internal/static"
	"gorm.io/gorm"
)

func main() {
	dbPath := flag.String("db", "text-idle.db", "path to SQLite database file")
	addrFlag := flag.String("addr", "", "listen address (overrides PORT/LISTEN_ADDR env)")
	flag.Parse()

	db, err := gorm.Open(sqlite.Open(*dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}, &model.LeaderboardEntry{}, &model.TeamNameClaim{}); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}

	leaderboardRepo := repository.NewLeaderboardRepository(db)
	saveRepo := repository.NewPlayerSaveRepository(db)
	teamNameRepo := repository.NewTeamNameRepository(db)
	leaderboardService := service.NewLeaderboardService(leaderboardRepo, saveRepo)
	teamNameService := service.NewTeamNameService(teamNameRepo, saveRepo)
	if err := teamNameService.BackfillAll(); err != nil {
		log.Printf("team name backfill warning: %v", err)
	}
	if err := leaderboardService.BackfillAll(); err != nil {
		log.Printf("leaderboard backfill warning: %v", err)
	}

	var staticFS fs.FS
	if f := static.GetFS(); f != nil {
		staticFS = *f
	}
	r := server.NewRouter(db, staticFS)

	addr := resolveListenAddr(*addrFlag)
	log.Printf("server starting on %s (db=%s)", addr, *dbPath)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}

func resolveListenAddr(addrFlag string) string {
	if addrFlag != "" {
		return addrFlag
	}
	if port := os.Getenv("PORT"); port != "" {
		if port[0] == ':' {
			return port
		}
		return ":" + port
	}
	if addr := os.Getenv("LISTEN_ADDR"); addr != "" {
		return addr
	}
	return ":8080"
}
