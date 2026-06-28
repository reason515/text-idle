package repository_test

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/text-idle/text-idle/internal/model"
	"github.com/text-idle/text-idle/internal/repository"
	"gorm.io/gorm"
)

func setupCombatDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&model.PlayerCombatState{}, &model.CombatEvent{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func TestPlayerCombatStateRepository_ListDue(t *testing.T) {
	db := setupCombatDB(t)
	repo := repository.NewPlayerCombatStateRepository(db)
	now := time.Now().UTC()
	past := now.Add(-time.Minute)
	future := now.Add(time.Hour)

	rows := []model.PlayerCombatState{
		{UserID: 1, Status: model.CombatStatusRunning, NextTickAt: past, LastTickAt: past},
		{UserID: 2, Status: model.CombatStatusRunning, NextTickAt: future, LastTickAt: now},
		{UserID: 3, Status: model.CombatStatusPaused, NextTickAt: past, LastTickAt: past},
	}
	for i := range rows {
		if err := repo.Upsert(&rows[i]); err != nil {
			t.Fatalf("upsert: %v", err)
		}
	}

	due, err := repo.ListDue(now, 50)
	if err != nil {
		t.Fatalf("list due: %v", err)
	}
	if len(due) != 1 || due[0].UserID != 1 {
		t.Fatalf("expected user 1 due, got %+v", due)
	}
}

func TestCombatEventRepository_AppendTrim(t *testing.T) {
	db := setupCombatDB(t)
	repo := repository.NewCombatEventRepository(db)
	for i := int64(1); i <= 205; i++ {
		if err := repo.Append(1, i, "test", `{}`); err != nil {
			t.Fatalf("append %d: %v", i, err)
		}
	}
	events, err := repo.ListSince(1, 0, 300)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(events) != 200 {
		t.Fatalf("expected trim to 200, got %d", len(events))
	}
	if events[0].Seq != 6 {
		t.Fatalf("expected oldest seq 6 after trim, got %d", events[0].Seq)
	}
}
