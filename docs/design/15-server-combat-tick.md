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
  -> WorkerPool.Submit(TickUser up to COMBAT_MAX_OFFLINE_TICKS_PER_SCAN)

TickUser:
  load PlayerSave + PlayerCombatState
  RunOneCycle (internal/combat, nowMs for timeline)
  persist save, combat state, CombatEvent, leaderboard
  WebSocket broadcast (if connected)
```

**Dual scheduling modes:**

| Mode | When | `next_tick_at` after tick |
|------|------|---------------------------|
| **ClientGated** | `/main` visible: WS connected + `POST /combat/presence` within **90s** | Far future until `POST /combat/advance` |
| **WallClock** | `POST /combat/arm-offline` (pagehide / tab hidden / browser close), WS drop after presence window, or presence timeout | `now + last_cycle_delay_ms` (scheduler auto-ticks) |

E2E (`TEXT_IDLE_E2E=1`): short delays; scheduler disabled; use `POST /debug/combat/tick`.

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
| `offline_cap_until` | Wall-clock end of current offline earning window (`arm-offline` sets `now + 24h`) |
| `last_client_seen_at` | Last `POST /combat/presence` from visible `/main` |

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

When the client calls `POST /combat/arm-offline` (or server migrates a stuck client-gated row on deploy):

```text
offline_cap_until = now + 24h
next_tick_at = max(now, last_tick_at + last_cycle_delay_ms)
```

Wall-clock scheduler ticks while `now < offline_cap_until`. When capped, no further combat runs until the next `arm-offline` starts a new 24h window.

`POST /combat/resume` only clears pause; it does **not** batch catch-up ticks (scheduler handles wall-clock progress).

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
| POST | `/combat/resume` | `status=running` (unpause only) |
| POST | `/combat/arm-offline` | Start wall-clock mode + 24h cap window |
| POST | `/combat/schedule-arm-offline` | Server-side 3s timer: arm wall-clock unless `POST /combat/presence` cancels first (tab hidden / window blur) |
| POST | `/combat/presence` | Refresh client-gated presence (visible `/main`); cancels pending schedule-arm-offline |
| POST | `/combat/advance` | Run next combat cycle after client log replay completes |
| GET | `/combat/status` | Lightweight combat state |
| GET | `/combat/events?since=` | Event replay |
| GET | `/combat/ws` | WebSocket stream (JWT) |

**Test-only:** `POST /debug/combat/tick` when `TEXT_IDLE_E2E=1` forces immediate tick for user.

---

## 7. Client role

- Remove `runCombatLoop` as authority; subscribe to WS + poll events.
- On `/main` load: `POST /combat/resume` (if not paused) → `syncFromServerSave` → **offline summary** → connect WS + start presence heartbeat → advance when log replay completes.
- **Refresh / return:** session snapshot stores `displayedEventSeq` (last event fully shown on screen) separately from leave-time `eventSeq` (offline gap detection). Poll `GET /combat/events?since=displayedEventSeq` before `POST /combat/advance`; do not bootstrap advance while client-gated and events remain undisplayed. **Quick reload (F5):** snapshot also stores `displayedLogEntries`, `logBatchEventSeq`, and `logStepIndex`; on return the client restores the log and resumes `log_batch` replay from the saved step (instant-apply prior steps to the panel only) instead of replaying the whole battle from turn 1.
- `combatPresence.js`: tab hidden **3s+** or window **blur** (browser not in foreground while tab stays visible) or `pagehide` (including **browser close while tab still visible**, but not F5 reload) → wall-clock mode via **`POST /combat/schedule-arm-offline`** (server timer; not throttled like background `setTimeout`) or immediate **`POST /combat/arm-offline`** on `pagehide`; **quick reload** (`visibilitychange` → `hidden` then `pagehide` within 3s) skips immediate arm-offline on `pagehide` and **`POST /combat/presence` on /main mount cancels** the server schedule so the client stays client-gated and replays undisplayed events instead of wall-clock catch-up. Leaving `/main` via in-app route (tab still visible) arms offline on unmount. Visible `/main` → periodic `POST /combat/presence`; **presence heartbeat pauses while the tab is hidden or the window is unfocused** so wall-clock mode is not cancelled by background presence. **WebSocket drop** with recent presence schedules server-side arm-offline after the **90s** presence window (not a one-shot skip).
- Long offline return: if `eventSeq` gap > 10, skip historical log replay; load authoritative save (stats + leaderboard track) and continue from next ClientGated cycle.
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

## 9. Statistics and leaderboard

Each successful tick (WallClock or ClientGated) runs `runServerCombatCycle` in the embedded bundle: `applyBattleToPlayerStats`, `applyRestToPlayerStats`, `applyBattleToLeaderboardTrack`, `applyRestToLeaderboardTrack`. `storeSave` calls `UpsertFromSaveJSON` for `leaderboard_entries`.

`RunCycle` passes `nowMs` for `battleTimeline.endedAtMs`. Offline ticks use the same path as online; skipping log replay on return does **not** skip stat accumulation (authoritative data is in save JSON).

See [13-player-statistics.md](./13-player-statistics.md) section 3.
