# Server-side idle combat (Path B)

## 1. Goal

Move **authoritative** idle combat from the browser to the Go server. The client becomes a display and input layer; progress continues while the tab is hidden, the browser is closed, or the machine sleeps (within the offline cap).

| Item | Value |
|------|--------|
| Scheduler | Central ticker (1s) + worker pool; scan `next_tick_at <= now()` |
| Combat engine | Go package `internal/combat/` loads embedded JS bundle (esbuild + goja) for parity with Vitest; `RunCycle` is the server entry |
| Offline cap | **24 hours** wall-clock; no retroactive gain beyond cap |
| Blocking UX | Boss expansion recruit and skill milestones **do not pause** ticks; pending flags + red-dot UI |
| DB (MVP) | SQLite; batch `LIMIT 50` due users per scheduler round |

See also: [01-overview.md](./01-overview.md) (offline engage), [03-combat.md](./03-combat.md) (rules), [09-social-ui.md](./09-social-ui.md) (WS), [13-player-statistics.md](./13-player-statistics.md) (stats on tick).

---

## 2. Architecture

```text
CombatScheduler (1s)
  -> ListDueCombatStates(limit=50)
  -> WorkerPool.Submit(TickUser)

TickUser:
  load PlayerSave + PlayerCombatState
  RunOneCycle (internal/combat)
  persist save, combat state, CombatEvent, leaderboard
  WebSocket broadcast (if connected)
```

**Wall-clock between cycles (online):** After each tick the scheduler sets `next_tick_at` to a client-resume gate; the **next** cycle runs only when the browser calls `POST /combat/advance` after finishing log replay. The 1s scheduler still picks up brand-new accounts (`next_tick_at=now`) and E2E (`TEXT_IDLE_E2E=1` keeps short delays). Offline catch-up runs inside `POST /combat/resume` when wall time since `last_tick_at` exceeds `last_cycle_delay_ms`.

---

## 3. Data model

### 3.1 `player_combat_states`

| Column | Meaning |
|--------|---------|
| `user_id` | PK, FK to users |
| `status` | `running` \| `paused` \| `empty_squad` |
| `next_tick_at` | When the next full battle cycle may run |
| `last_tick_at` | Last successful tick timestamp |
| `rng_seed` | Persisted PRNG state |
| `combat_version` | Formula/skill/payload version for migrations (**2** = authoritative `encounter` + `steps` on `log_batch`) |
| `paused_at` | Set when user pauses |
| `pending_expansion` | JSON blob for non-blocking recruit offer |
| `event_seq` | Monotonic event counter per user |

### 3.2 `combat_events`

Recent events for `GET /combat/events?since=` and WS recovery. Trim to last N per user in application logic.

| Type | Purpose |
|------|---------|
| `combat.log_batch` | Combat log slice for online UI (**emitted before** `combat.cycle_complete` on each tick). Payload: `{ log, encounter, steps }` — see **3.2.1**. |
| `combat.cycle_complete` | Outcome, rewards, rest steps, exploration delta |
| `combat.pending_expansion` | Expansion recruit available (non-blocking) |

#### 3.2.1 `combat.log_batch` payload (`combat_version` ≥ 2)

| Field | Role |
|-------|------|
| `log` | Narrative combat log (text, SFX, floats); **not** the HP bar data source |
| `encounter` | `{ monsters, heroes }` — full unit snapshot at battle start (static + opening HP/MP) |
| `steps` | One panel snapshot per log line; `steps.length === log.length`. Dynamic fields only (HP, MP, debuffs, buffs, shield, taunt) merged by unit `id` |

Silent typed rows (e.g. `roundMaintenance` at round end) advance `steps` but produce **no** battle-log line and **no** SFX; pacing treats them as **0ms** reveal. Old payloads without `encounter`/`steps` are not replayed.

### 3.3 Save JSON extensions

In `PlayerSave.SaveData`:

- `pendingExpansionRecruit`: `{ mapId, slot, level, druidOnly }` when boss unlocks a seat; **combat continues**
- `combatState` (optional embed on GET): `{ status, nextTickAt, lastTickAt }`

**Server-only fields** (client PATCH must not change): `gold`, `inventory` (except validated equip flows), `playerStats.cumulativeGold`, `playerStats.cumulativeXp`, `playerStats.combatActionSteps`, `playerStats.restSteps`, `playerStats.battleTimeline`, `playerStats.battleCount`, `playerStats.victoryCount`, `playerStats.damageByHero`, `playerStats.injuryByHero`, `leaderboardTrack`.

**Client PATCH allowed:** `teamName`, `squad` (tactics, attrs, skills, equipment slots), `combatProgress.currentMapId`, `playerStats.displayScaleN`.

**Combat state sync:** `SyncCombatStateFromSave` runs on `GET /save`, `PUT /save`, and `PATCH /save/player`. If the player had `status=empty_squad` (created before intro/recruitment) and the save later has a non-empty squad, status becomes `running` and `next_tick_at=now` so the scheduler picks up combat without manual intervention.

---

## 4. Offline cap (24h)

On each tick, if `now - last_tick_at` exceeds 24h (e.g. server downtime or long absence), treat elapsed scheduling as capped:

```text
schedulable_until = last_tick_at + 24h
if now > schedulable_until and next_tick_at > schedulable_until:
  advance last_tick_at and next_tick_at to now without running combat (no retroactive burst)
cap_start = now - 24h
if last_tick_at < cap_start:
  last_tick_at = cap_start
```

No retroactive burst beyond one cap window on first login after long absence (migration sets `last_tick_at = now`).

---

## 5. Pending expansion recruit (non-blocking)

When `shouldPromptExpansionRecruitAfterBoss` would have opened a modal:

1. Server sets `pendingExpansionRecruit` in save and `pending_expansion` on combat state.
2. Emits `combat.pending_expansion` event.
3. **Does not** set `status=paused`; `next_tick_at` advances normally.
4. Client shows red dot on squad / recruit entry (same pattern as unassigned attr points).
5. Player opens `/character-select` when ready; clearing pending on successful recruit.

---

## 6. API (MVP)

| Method | Path | Role |
|--------|------|------|
| GET | `/save` | Authoritative save + embedded combat summary |
| PATCH | `/save/player` | Whitelist player edits |
| PUT | `/save` | Rejected if authoritative fields change (legacy clients) |
| POST | `/combat/pause` | `status=paused` |
| POST | `/combat/resume` | `status=running`; offline catch-up while client-gated; does **not** arm scheduler |
| POST | `/combat/advance` | Run next combat cycle after client log replay completes |
| GET | `/combat/status` | Lightweight combat state |
| GET | `/combat/events?since=` | Event replay |
| GET | `/combat/ws` | WebSocket stream (JWT) |

**Test-only:** `POST /debug/combat/tick` when `TEXT_IDLE_E2E=1` forces immediate tick for user.

---

## 7. Client role

- Remove `runCombatLoop` as authority; subscribe to WS + poll events.
- On `/main` load, restore pause UI from embedded `combatState.status`; call `POST /combat/resume` only when the client is not paused.
- [combatPacing.js](../../frontend/src/game/combatPacing.js) is **display-only** for log animation when tab is visible.
- Audio: unchanged ([14-audio.md](./14-audio.md)); mute when tab hidden.
- **Event ordering:** `serverCombatEventCoordinator.js` holds `cycle_complete` until the matching `log_batch` replay finishes, then calls `POST /combat/advance` via `scheduleNextServerCombatPoll`. On `visibilitychange` → `visible`, the client **polls only** (no advance/resume). Background tabs **pause** log replay until visible again.

### 7.1 Offline combat summary (return visit)

When the player returns to `/main` after being away for at least **1 minute**, the client compares a **local session snapshot** (`localStorage` key `tiOfflineSession`) with the authoritative save from `GET /save`:

| Field | Snapshot source | Delta vs current save |
|-------|-----------------|------------------------|
| Offline duration | `leftAtMs` | `now - leftAtMs`, display capped at **24h** |
| Gold / XP | `playerStats.cumulativeGold` / `cumulativeXp` | Positive delta only |
| Battles | `playerStats.battleCount` / `victoryCount` | Positive delta; defeats = battles − victories |
| Equipment | `inventoryIds` | Items in current inventory whose `id` was not in the snapshot |

The snapshot is written on `pagehide`, tab `visibilitychange` → `hidden`, and when leaving `/main`. After the summary modal is dismissed (or when no summary is shown), the snapshot is refreshed to the current save so a quick refresh does not re-open the modal.

If there is no snapshot (new browser / cleared storage) or offline time is under 1 minute, **no** modal is shown. If away time exceeds 1 minute but there was no combat progress (empty squad), **no** modal is shown.

UI: `OfflineCombatSummaryModal` on the main battle screen (`data-testid="offline-summary-modal"`).

---

## 8. Migration

Existing players on deploy: create `PlayerCombatState` with `next_tick_at=now`, `last_tick_at=now`, `status=running` if squad non-empty; **no** backfill of missed battles.

---

## 9. Statistics

Each successful tick calls the same increments as client `applyBattleToPlayerStats` / `applyRestToPlayerStats` after `RunOneCycle`. Timeline entries use server `time.Now()` for `endedAtMs`.
