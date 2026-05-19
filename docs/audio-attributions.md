# Audio Attributions

All sample files served from `frontend/public/audio/sfx/` are sourced from
[Kenney.nl](https://kenney.nl) under the **CC0 1.0 (Public Domain)** license.
Attribution is not legally required; we list packs here for transparency.

## Packs

| Pack | URL |
|------|-----|
| Impact Sounds | <https://kenney.nl/assets/impact-sounds> |
| RPG Audio | <https://kenney.nl/assets/rpg-audio> |
| Digital Audio | <https://kenney.nl/assets/digital-audio> |
| Music Jingles | <https://kenney.nl/assets/music-jingles> |

## Event mapping (current)

| Game event | File(s) (in `frontend/public/audio/sfx/`) | Source pack |
|------------|-------------------------------------------|-------------|
| Physical hit (normal) | `impactPlank_medium_000.ogg`, `impactPlank_medium_002.ogg`, `impactPlank_medium_004.ogg` | Impact Sounds |
| Physical hit (crit) | `impactMetal_heavy_000.ogg`, `impactMetal_heavy_002.ogg` | Impact Sounds |
| Magic hit (normal) | `impactBell_heavy_002.ogg`, `impactBell_heavy_004.ogg` | Impact Sounds |
| Magic hit (crit) | `impactBell_heavy_000.ogg` | Impact Sounds |
| Mixed hit | reuses physical + bell layer | Impact Sounds |
| Dodge / miss | `clothBelt2.ogg` | RPG Audio |
| DoT (physical) | `impactPlank_medium_001.ogg` | Impact Sounds |
| DoT (magic) | `impactBell_heavy_001.ogg` | Impact Sounds |
| Unit defeated | `lowThreeTone.ogg` | Digital Audio |
| Victory summary | `jingles-hit_00.ogg` | Music Jingles |
| Defeat summary | `jingles-hit_07.ogg` | Music Jingles |

Files are loaded lazily on the first user-driven audio gesture and decoded
into `AudioBuffer`s. If a sample fails to load (offline, blocked, etc.),
the runtime falls back to the previous Web Audio synthesis so the game
never falls silent unexpectedly.

## Replacing or expanding samples

1. Drop a new `.ogg` (or `.wav`) into `frontend/public/audio/sfx/`.
2. Update the `SAMPLE_MANIFEST` in `frontend/src/audio/audioBus.js`.
3. Update the table above and `docs/design/14-audio.md`.
4. Keep the new pack's license CC0-compatible, or add an attribution row.
