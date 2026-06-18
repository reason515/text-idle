package main

import (
	"flag"
	"io/fs"
	"log"

	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/server"
	"github.com/text-idle/text-idle/internal/static"
	"gorm.io/gorm"
)

func main() {
	dbPath := flag.String("db", "text-idle.db", "path to SQLite database file")
	flag.Parse()

	db, err := gorm.Open(sqlite.Open(*dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}, &model.PlayerSave{}); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}

	var staticFS fs.FS
	if f := static.GetFS(); f != nil {
		staticFS = *f
	}
	r := server.NewRouter(db, staticFS)
	log.Printf("server starting on :8080 (db=%s)", *dbPath)
	r.Run(":8080")
}
