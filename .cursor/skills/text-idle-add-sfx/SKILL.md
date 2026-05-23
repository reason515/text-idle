---
name: text-idle-add-sfx
description: >-
  Adds combat and UI sound effects to Text Idle from Freesound.org (CC0 only):
  search, download, wire into audioBus, hook playback, update attributions and
  tests. Use when adding SFX, sound effects, audio cues, Freesound assets, or
  when the user asks to add sounds for game events.
---

# Text Idle - Add Sound Effects

End-to-end workflow for new client SFX. Read [docs/design/14-audio.md](../../docs/design/14-audio.md) and [docs/audio-attributions.md](../../docs/audio-attributions.md) before starting.

## Hard rules

| Rule | Detail |
|------|--------|
| **License** | **CC0 only** (`http://creativecommons.org/publicdomain/zero/1.0/`). Reject CC-BY, CC-BY-NC, Attribution. |
| **Source** | Prefer [Freesound.org](https://freesound.org/). Kenney CC0 packs already in repo for map impacts/jingles. |
| **Encoding** | Source code ASCII only. Docs may use non-ASCII. |
| **Playback** | Tie SFX to **log reveal** or an existing audio hook in `MainScreen.vue` -- never a separate real-time timeline (idle/turn-based game). |
| **E2E** | Usually **N/A**: `isE2eFastMode()` suppresses combat SFX; no log text change. State reason in Sync summary. |

## File map

| Path | Role |
|------|------|
| `frontend/public/audio/sfx/` | Committed audio files (`fs_*`, Kenney `*.ogg`) |
| `frontend/src/audio/audioBus.js` | `SAMPLE_MANIFEST`, `SAMPLE_MAX_DURATION_SEC`, `play*Sound()`, synth fallbacks |
| `frontend/src/audio/skillSfxMap.js` | Skill id -> manifest category (skill SFX only) |
| `frontend/src/audio/mapSfxMap.js` | Map id -> manifest category (map entry only) |
| `frontend/src/views/MainScreen.vue` | Log-driven playback (`addLogEntries`, `animateCombatLog`, etc.) |
| `scripts/download-freesound-sfx.ps1` | OAuth bulk download (sound id -> local name) |
| `docs/audio-attributions.md` | Freesound id, author, URL, manifest mapping |
| `docs/design/14-audio.md` | Design doc: events, categories, hooks |
| `frontend/src/audio/audioBus.spec.js` | Unit tests for new `play*Sound` |

## Workflow checklist

Copy and track:

```
SFX task:
- [ ] 1. Pick event + manifest category name (camelCase, e.g. levelUp)
- [ ] 2. Search Freesound; verify CC0 via API
- [ ] 3. Download file into frontend/public/audio/sfx/
- [ ] 4. Register in audioBus.js (manifest + max duration + play fn + synth fallback)
- [ ] 5. Hook playback at log reveal (MainScreen or existing play* caller)
- [ ] 6. Add id to scripts/download-freesound-sfx.ps1
- [ ] 7. Update docs/audio-attributions.md + docs/design/14-audio.md
- [ ] 8. Extend audioBus.spec.js (synth path + cached sample path)
- [ ] 9. npm run test in frontend/
```

## Step 1 - Choose category and local filename

- **Manifest key**: camelCase string used in `SAMPLE_MANIFEST` (e.g. `lootDrop`, `levelUp`, `skillFire`).
- **Local file**: `fs_<event>.wav` or `.ogg` / `.mp3` if extension matches decode type. Map entry may use Kenney `*.ogg` without `fs_` prefix.
- **Duration cap**: Set `SAMPLE_MAX_DURATION_SEC[category]` to trim long uploads (typical 0.4-2.2s).

Existing hook patterns:

| Event type | Hook location |
|------------|---------------|
| Combat log line | `playCombatLogLineSound(entry)`; skill rows via `skillSfxMap.js` |
| Unit defeated | `playCombatUnitDeathSound(defeatEntry)` |
| Encounter / map entry | `playCombatEncounterSound`, `playMapEntrySound` in combat loop |
| Victory / defeat summary | `addLogEntries` when `type === 'summary'` |
| Custom progression | New `playFooSound()` called from `addLogEntries` or combat loop |

## Step 2 - Search Freesound (CC0 only)

### Web

Search on https://freesound.org/ with terms like `level up`, `item pickup`, `UI stinger`. Open candidate pages and confirm **Creative Commons 0** badge (not CC BY).

### API (recommended for license filter)

Requires `FREESOUND_API_KEY` in repo root `.env` (see `.env.example`). Read-only metadata works with API key alone.

```powershell
cd d:\code\text-idle
$envVars = @{}; Get-Content .env | ForEach-Object { $line = $_.Trim(); if ($line -eq '' -or $line.StartsWith('#')) { return }; $i = $line.IndexOf('='); if ($i -ge 1) { $envVars[$line.Substring(0,$i).Trim()] = $line.Substring($i+1).Trim() } }
$apiKey = $envVars['FREESOUND_API_KEY']
$q = [uri]::EscapeDataString('level up')
$r = Invoke-RestMethod -Uri "https://freesound.org/apiv2/search/text/?query=$q&filter=license:%22Creative+Commons+0%22&fields=id,name,duration,license,username&page_size=15&token=$apiKey"
$r.results | ForEach-Object { Write-Host "$($_.id) dur=$($_.duration) $($_.username): $($_.name)" }
```

Verify one candidate:

```powershell
$m = Invoke-RestMethod -Uri "https://freesound.org/apiv2/sounds/SOUND_ID/?token=$apiKey"
$m.license   # must be http://creativecommons.org/publicdomain/zero/1.0/
$m.duration  # prefer under ~3s for UI stingers
```

**Selection tips**

- Prefer short UI stingers for level-up / loot; combat hits ~0.5-1s.
- Same author as existing assets is fine (e.g. qubodup) if CC0.
- Avoid sounds tagged for real-time seconds; game uses turns only in docs.

## Step 3 - Download

### A. OAuth originals (preferred)

Add `fs_<name> = SOUND_ID` to `$files` in [scripts/download-freesound-sfx.ps1](../../scripts/download-freesound-sfx.ps1), then:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/download-freesound-sfx.ps1
```

Requires `.env`: `FREESOUND_CLIENT_ID`, `FREESOUND_API_KEY`, `FREESOUND_REFRESH_TOKEN`.

If script prints `invalid_grant`, refresh token expired -- use method B or renew token at Freesound API apply page.

When OAuth succeeds, script picks extension from metadata (`.wav`, `.ogg`, `.flac`). **Update `SAMPLE_MANIFEST` paths to match actual filename.**

### B. CDN HQ preview (fallback, CC0 only)

When OAuth fails but sound is CC0, fetch preview URL from API and download:

```powershell
$m = Invoke-RestMethod -Uri "https://freesound.org/apiv2/sounds/SOUND_ID/?token=$apiKey"
$url = $m.previews.'preview-hq-ogg'
$dst = "frontend/public/audio/sfx/fs_my_event.ogg"
Invoke-WebRequest -Uri $url -OutFile $dst -UseBasicParsing
```

Note in `docs/audio-attributions.md` when file is CDN preview vs OAuth original (same pattern as `fs_skill_taunt.mp3`, `fs_level_up.ogg`).

### C. Kenney CC0 (map / generic impacts)

Already under `frontend/public/audio/sfx/*.ogg`. No Freesound id; cite Kenney.nl in attributions doc.

## Step 4 - Register in audioBus.js

1. Add category to `SAMPLE_MANIFEST`:

```javascript
myEvent: ['/audio/sfx/fs_my_event.wav'],
```

2. Add trim cap to `SAMPLE_MAX_DURATION_SEC`:

```javascript
myEvent: 1.2,
```

3. Export `playMyEventSound()` following existing pattern:

```javascript
export function playMyEventSound() {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  if (!tryPlaySample(ctx, 'myEvent', 0.9)) scheduleMyEventSynth(ctx)
  resumeContextIfNeeded(ctx)
}
```

4. Add `scheduleMyEventSynth(ctx)` -- short Web Audio fallback (oscillator + noise layers; copy tone from nearest similar category).

`preloadSamples` auto-includes all manifest URLs; no extra preload wiring.

## Step 5 - Hook playback

Primary binding: [MainScreen.vue](../../frontend/src/views/MainScreen.vue).

- Import new `play*Sound` from `../audio/audioBus.js`.
- Call when the **log line is revealed**, same step as related UI text.
- Example: `addLogEntries` loops entries -- on `type === 'levelUp'` call `playLevelUpSound()`.

Do **not** use HTML `title` for audio hints; unrelated to this skill.

For skill-specific sounds, extend [skillSfxMap.js](../../frontend/src/audio/skillSfxMap.js) instead of a new top-level export.

## Step 6 - Documentation

Update both:

- [docs/audio-attributions.md](../../docs/audio-attributions.md): table row (local file, Freesound id, author, URL); manifest key / when played.
- [docs/design/14-audio.md](../../docs/design/14-audio.md): event row in combat table + binding bullet under section 4.

## Step 7 - Tests

In [audioBus.spec.js](../../frontend/src/audio/audioBus.spec.js):

1. **Synth path**: call `playMyEventSound()` with no cached buffer; expect `createOscillator` or `createBufferSource`.
2. **Sample path**: `__setSampleBufferForTests('/audio/sfx/fs_my_event.wav', fakeBuffer)` then expect `createBufferSource`, not oscillator.

Run:

```powershell
cd frontend; npm run test
```

## Path triggers (workflow.mdc)

| You change | You MUST |
|------------|----------|
| `frontend/src/audio/**`, `frontend/public/audio/**` | Vitest in `audioBus.spec.js` (or related spec); design `14-audio.md`; `docs/audio-attributions.md` |
| `frontend/src/views/MainScreen.vue` (playback hook only) | Same docs; Vitest if logic moved; E2E usually N/A |
| `scripts/download-freesound-sfx.ps1` | Keep ids aligned with attributions |

## Example: level-up + loot (reference)

| Manifest key | File | Freesound | Hook |
|--------------|------|-----------|------|
| `levelUp` | `fs_level_up.ogg` | [442943](https://freesound.org/s/442943/) qubodup | `addLogEntries` on `type: 'levelUp'` |
| `lootDrop` | `fs_loot_drop.ogg` | [735168](https://freesound.org/s/735168/) Irolan | `addLogEntries` on victory `summary` with `rewards.equipment.length > 0` |

## Sync summary (mandatory in task reply)

- **docs/design**: `14-audio.md` or N/A
- **docs/requirements-format.md**: N/A unless AC mentions audio
- **docs/design-change-impact.md**: N/A unless core flow changes
- **Unit tests**: `audioBus.spec.js` paths
- **E2E**: N/A (reason) or spec path
- **Commands run**: `npm run test` result; download script if run
