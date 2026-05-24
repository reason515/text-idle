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
| `fs_phys_crit.ogg` | 591155 Sword Contact (with swipe) | ultraaxvii | https://freesound.org/s/591155/ |
| `fs_magic_hit.ogg` | 442774 Magic Spell | qubodup | https://freesound.org/s/442774/ |
| `fs_magic_crit.ogg` | 817466 Cliche Magic Spell Sound | qubodup | https://freesound.org/s/817466/ |
| `fs_dodge.wav` | 9509 whoosh.wav | petenice | https://freesound.org/s/9509/ |
| `fs_encounter.ogg` | 683184 Spawning | NearTheAtmoshphere | https://freesound.org/s/683184/ |
| `fs_encounter_boss.ogg` | 752582 Sound Design Elements Impact SFX PS 014 | AudioPapkin | https://freesound.org/s/752582/ |
| `fs_dot_phys.ogg` | 495117 Wet Splat 2 | nebulasnails | https://freesound.org/s/495117/ |
| `fs_dot_magic.ogg` | 827664 Negative Spell Effect | qubodup | https://freesound.org/s/827664/ |
| `fs_hero_death.ogg` | 808092 Character death 2 | randbsoundbites | https://freesound.org/s/808092/ |
| `fs_monster_death.ogg` | 249813 Goblin Death.wav | spookymodem | https://freesound.org/s/249813/ |
| `fs_victory.wav` | 844831 Victory Jingle | JoanStar | https://freesound.org/s/844831/ |
| `fs_defeat.wav` | 253174 Retro You Lose SFX | see Freesound page | https://freesound.org/s/253174/ |
| `fs_level_up.ogg` | 442943 Level Up | qubodup | https://freesound.org/s/442943/ |
| `fs_loot_drop.ogg` | 735168 Item Pickup Chime | Irolan | https://freesound.org/s/735168/ |

## Unit defeated SFX (`unitDefeated` log line)

Routing: `frontend/src/game/combatLogDefeat.js` (`resolveUnitDefeatedSide`); playback: `playCombatUnitDeathSound(defeatEntry)`.

| Manifest key | Local file | When |
|--------------|------------|------|
| `heroDeath` | `fs_hero_death.ogg` | Ally hero (`targetClass` set) |
| `monsterDeath` | `fs_monster_death.ogg` | Enemy monster (`targetTier` set) |

## Encounter SFX (`encounter` log line)

Playback: `playCombatEncounterSound({ isBoss })` when the encounter log line is revealed.

| Manifest key | Local file | When |
|--------------|------------|------|
| `encounter` | `fs_encounter_boss.ogg` | Normal monster pull |
| `encounterBoss` | `fs_encounter.ogg` | Boss encounter (`isBoss`) |

## Skill-specific SFX (by `skillId`)

Mapping: `frontend/src/audio/skillSfxMap.js`. Playback: `playCombatLogLineSound(entry)`.

| Local file | Freesound sound | Used for (examples) | Page |
|------------|-----------------|---------------------|------|
| `fs_skill_fire.wav` | 431174 Fireball Explosion | fireball, pyroblast, scorch | https://freesound.org/s/431174/ |
| `fs_skill_frost.wav` | 160420 iceSpell | frostbolt, frost-nova, ice-lance | https://freesound.org/s/160420/ |
| `fs_skill_heal.wav` | 562292 Heal - Rpg | flash-heal, greater-heal, rejuvenation, regrowth (+ HoT tick via `sourceSkillId`) | https://freesound.org/s/562292/ |
| `fs_skill_taunt.mp3` | 547203 Voice_AdultMale_PainGrunts_01 (HQ preview) | taunt, battle-shout | https://freesound.org/s/547203/ |
| `fs_skill_sunder.wav` | 812592 Clang | sunder-armor, shield-slam, maul, rake | https://freesound.org/s/812592/ |
| `fs_skill_shield.wav` | 570853 magicShield_block | power-word-shield, frost-armor, bear-form, defensive-stance | https://freesound.org/s/570853/ |

Note: `fs_skill_taunt.mp3`, `fs_level_up.ogg`, `fs_loot_drop.ogg`, `fs_phys_crit.ogg`, `fs_magic_hit.ogg`, `fs_magic_crit.ogg`, `fs_dot_phys.ogg`, `fs_dot_magic.ogg`, `fs_encounter.ogg`, `fs_encounter_boss.ogg`, `fs_hero_death.ogg`, and `fs_monster_death.ogg` are CC0 HQ previews from the Freesound CDN when OAuth download is unavailable. Other skill files are OAuth originals.

## Progression and loot SFX

Playback: `playLevelUpSound()` when a `levelUp` log line is revealed; `playLootDropSound()` when a victory `summary` includes equipment rewards (alongside victory SFX).

| Manifest key | Local file | When |
|--------------|------------|------|
| `levelUp` | `fs_level_up.ogg` | Hero level-up log line (`type: 'levelUp'`) |
| `lootDrop` | `fs_loot_drop.ogg` | Victory summary with one or more equipment drops |

## Map entry SFX (`mapEntry` log line)

Mapping: `frontend/src/audio/mapSfxMap.js`. Playback: `playMapEntrySound({ mapId })` when the map entry log line is revealed (before encounter SFX).

| Manifest key | Local file | Map | Theme |
|--------------|------------|-----|-------|
| `mapEntryElwynn` | `impactBell_heavy_000.ogg` | Elwynn Forest | Peaceful forest chime |
| `mapEntryWestfall` | `impactPlank_medium_002.ogg` | Westfall | Wheat fields / wooden farm |
| `mapEntryDuskwood` | `lowThreeTone.ogg` | Duskwood | Ominous dusk tone |
| `mapEntryRedridge` | `impactMetal_heavy_000.ogg` | Redridge Mountains | Wind and metal cliffs |
| `mapEntryStranglethorn` | `jingles-hit_07.ogg` | Stranglethorn Vale | Jungle drum jingle |

Kenney CC0 impact/jingle assets in `frontend/public/audio/sfx/*.ogg` (see Kenney.nl Impact Sounds / Digital Audio packs).

## Fallback

If samples fail to load/decode, `frontend/src/audio/audioBus.js` falls back to Web Audio synthesis.
