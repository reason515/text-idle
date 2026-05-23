# Audio Attributions

Combat SFX in `frontend/public/audio/sfx/` are **original uploads** from [Freesound.org](https://freesound.org/) under **CC0 1.0** (CC0 1.0 Universal).

Re-download (OAuth refresh token in local `.env`):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/download-freesound-sfx.ps1
```

See `.env.example` for required variables. Playback may trim long files per category (`SAMPLE_MAX_DURATION_SEC` in `audioBus.js`).

## Event mapping

| Local file | Freesound sound | Author | Page |
|------------|-----------------|--------|------|
| `fs_phys_hit.wav` | 547042 Hit Impact Sword 3 | CogFireStudios | https://freesound.org/s/547042/ |
| `fs_phys_crit.wav` | 815762 Metal hits (high) | xkeril | https://freesound.org/s/815762/ |
| `fs_magic_hit.wav` | 455206 Magic Spell 01.wav | LilMati | https://freesound.org/s/455206/ |
| `fs_magic_crit.wav` | 442774 Magic Spell | qubodup | https://freesound.org/s/442774/ |
| `fs_dodge.wav` | 9509 whoosh.wav | petenice | https://freesound.org/s/9509/ |
| `fs_dot_phys.wav` | 336495 LowHit_01.wav | Faulkin | https://freesound.org/s/336495/ |
| `fs_dot_magic.wav` | 781094 videogame sci-fi / fantasy damage efect | CVLTIV8R | https://freesound.org/s/781094/ |
| `fs_death.wav` | 616504 weapon drop.wav | Empiremonkey | https://freesound.org/s/616504/ |
| `fs_victory.wav` | 844831 Victory Jingle | JoanStar | https://freesound.org/s/844831/ |
| `fs_defeat.wav` | 253174 Retro You Lose SFX | see Freesound page | https://freesound.org/s/253174/ |

## Unit defeated SFX (`unitDefeated` log line)

Routing: `frontend/src/game/combatLogDefeat.js` (`resolveUnitDefeatedSide`); playback: `playCombatUnitDeathSound(defeatEntry)`.

| Manifest key | Local file | When |
|--------------|------------|------|
| `heroDeath` | `fs_death.wav` | Ally hero (`targetClass` set) |
| `monsterDeath` | `fs_dot_phys.wav` | Enemy monster (`targetTier` set) |

## Encounter SFX (`encounter` log line)

Playback: `playCombatEncounterSound({ isBoss })` when the encounter log line is revealed.

| Manifest key | Local file | When |
|--------------|------------|------|
| `encounter` | `fs_dodge.wav` | Normal monster pull |
| `encounterBoss` | `fs_phys_crit.wav` | Boss encounter (`isBoss`) |

## Skill-specific SFX (by `skillId`)

Mapping: `frontend/src/audio/skillSfxMap.js`. Playback: `playCombatLogLineSound(entry)`.

| Local file | Freesound sound | Used for (examples) | Page |
|------------|-----------------|---------------------|------|
| `fs_skill_fire.wav` | 431174 Fireball Explosion | fireball, pyroblast, scorch | https://freesound.org/s/431174/ |
| `fs_skill_frost.wav` | 160420 iceSpell | frostbolt, frost-nova, ice-lance | https://freesound.org/s/160420/ |
| `fs_skill_heal.wav` | 562292 Heal - Rpg | flash-heal, greater-heal | https://freesound.org/s/562292/ |
| `fs_skill_taunt.mp3` | 547203 Voice_AdultMale_PainGrunts_01 (HQ preview) | taunt, battle-shout | https://freesound.org/s/547203/ |
| `fs_skill_sunder.wav` | 812592 Clang | sunder-armor, shield-slam | https://freesound.org/s/812592/ |
| `fs_skill_shield.wav` | 570853 magicShield_block | power-word-shield, frost-armor | https://freesound.org/s/570853/ |

Note: `fs_skill_taunt.mp3` is the public CDN HQ preview (CC0); other skill files are OAuth originals.

## Fallback

If samples fail to load/decode, `frontend/src/audio/audioBus.js` falls back to Web Audio synthesis.
