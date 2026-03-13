package main

import (
	"io/fs"
	"log"

	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/server"
	"github.com/text-idle/text-idle/internal/static"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("text-idle.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}

	var staticFS fs.FS
	if f := static.GetFS(); f != nil {
		staticFS = *f
	}
	r := server.NewRouter(db, staticFS)
	log.Println("server starting on :8080")
	r.Run(":8080")
}
