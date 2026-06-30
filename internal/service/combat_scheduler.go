package service

import (
	"context"
	"log"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/text-idle/text-idle/internal/repository"
)

// CombatScheduler scans due combat states and dispatches ticks to a worker pool.
type CombatScheduler struct {
	combatStateRepo *repository.PlayerCombatStateRepository
	loopService     *CombatLoopService
	interval        time.Duration
	workers         int
}

func NewCombatScheduler(
	combatStateRepo *repository.PlayerCombatStateRepository,
	loopService *CombatLoopService,
) *CombatScheduler {
	interval := time.Second
	if ms := os.Getenv("COMBAT_TICK_INTERVAL_MS"); ms != "" {
		if n, err := strconv.Atoi(ms); err == nil && n > 0 {
			interval = time.Duration(n) * time.Millisecond
		}
	}
	workers := 4
	if w := os.Getenv("COMBAT_WORKER_COUNT"); w != "" {
		if n, err := strconv.Atoi(w); err == nil && n > 0 {
			workers = n
		}
	}
	return &CombatScheduler{
		combatStateRepo: combatStateRepo,
		loopService:     loopService,
		interval:        interval,
		workers:         workers,
	}
}

func (s *CombatScheduler) Start(ctx context.Context) {
	if os.Getenv("TEXT_IDLE_E2E") == "1" {
		log.Printf("combat scheduler auto-tick disabled in E2E (use POST /debug/combat/tick)")
		<-ctx.Done()
		return
	}
	ticker := time.NewTicker(s.interval)
	defer ticker.Stop()
	sem := make(chan struct{}, s.workers)
	var wg sync.WaitGroup
	log.Printf("combat scheduler started (interval=%s workers=%d)", s.interval, s.workers)
	if synced, err := s.loopService.BackfillStuckCombatStates(time.Now()); err != nil {
		log.Printf("combat backfill warning: %v", err)
	} else if synced > 0 {
		log.Printf("combat backfill synced %d player saves", synced)
	}
	for {
		select {
		case <-ctx.Done():
			wg.Wait()
			log.Printf("combat scheduler stopped")
			return
		case now := <-ticker.C:
			due, err := s.combatStateRepo.ListDue(now, 50)
			if err != nil {
				log.Printf("combat scheduler list due: %v", err)
				continue
			}
			for _, row := range due {
				row := row
				sem <- struct{}{}
				wg.Add(1)
				go func() {
					defer wg.Done()
					defer func() { <-sem }()
					defer func() {
						if r := recover(); r != nil {
							log.Printf("combat tick user %d panic: %v", row.UserID, r)
						}
					}()
					if err := s.loopService.TickUser(row.UserID, now); err != nil {
						log.Printf("combat tick user %d: %v", row.UserID, err)
					}
				}()
			}
		}
	}
}
