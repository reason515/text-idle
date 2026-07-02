/**
 * Authoritative combat panel state from engine snapshots (encounter + steps).
 */

import { MAP_MONSTER_POOLS, createMonster } from './combat.js'

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value))
}

function cloneDebuffs(debuffs) {
  return Array.isArray(debuffs) ? debuffs.map((d) => ({ ...d })) : []
}

function cloneBuffs(buffs) {
  return Array.isArray(buffs) ? buffs.map((b) => ({ ...b })) : []
}

function cloneShield(shield) {
  if (!shield || typeof shield !== 'object') return undefined
  return { ...shield }
}

function cloneTaunt(taunt) {
  if (!taunt || typeof taunt !== 'object') return undefined
  return { ...taunt }
}

/** @param {object} unit */
function serializeMonsterUnit(unit) {
  return {
    id: unit.id,
    typeId: unit.typeId,
    name: unit.name,
    tier: unit.tier,
    level: unit.level ?? 1,
    damageType: unit.damageType ?? 'physical',
    skill: unit.skill ?? null,
    skillChance: unit.skillChance,
    maxHP: unit.maxHP,
    currentHP: unit.currentHP,
    physAtk: unit.physAtk,
    spellPower: unit.spellPower,
    agility: unit.agility,
    armor: unit.armor,
    resistance: unit.resistance,
    physCrit: unit.physCrit,
    spellCrit: unit.spellCrit,
    hit: unit.hit,
    dodge: unit.dodge,
    debuffs: cloneDebuffs(unit.debuffs),
    taunt: cloneTaunt(unit.taunt),
    shield: cloneShield(unit.shield),
  }
}

/** @param {object} unit */
function serializeHeroUnit(unit) {
  return {
    id: unit.id,
    name: unit.name,
    class: unit.class,
    level: unit.level ?? 1,
    maxHP: unit.maxHP,
    currentHP: unit.currentHP,
    maxMP: unit.maxMP,
    currentMP: unit.currentMP,
    agility: unit.agility,
    debuffs: cloneDebuffs(unit.debuffs),
    buffs: cloneBuffs(unit.buffs),
    shield: cloneShield(unit.shield),
  }
}

/** @param {object} unit */
function serializeMonsterStep(unit) {
  return {
    id: unit.id,
    maxHP: unit.maxHP,
    currentHP: unit.currentHP,
    debuffs: cloneDebuffs(unit.debuffs),
    taunt: cloneTaunt(unit.taunt),
    shield: cloneShield(unit.shield),
  }
}

/** @param {object} unit */
function serializeHeroStep(unit) {
  return {
    id: unit.id,
    maxHP: unit.maxHP,
    currentHP: unit.currentHP,
    maxMP: unit.maxMP,
    currentMP: unit.currentMP,
    debuffs: cloneDebuffs(unit.debuffs),
    buffs: cloneBuffs(unit.buffs),
    shield: cloneShield(unit.shield),
  }
}

/**
 * @param {object[]} monsterUnits
 * @param {object[]} heroUnits
 */
export function serializeEncounter(monsterUnits, heroUnits) {
  return {
    monsters: (monsterUnits || []).map(serializeMonsterUnit),
    heroes: (heroUnits || []).map(serializeHeroUnit),
  }
}

/**
 * @param {object[]} heroUnits
 * @param {object[]} monsterUnits
 */
export function serializePanelStep(heroUnits, monsterUnits) {
  return {
    monsters: (monsterUnits || []).map(serializeMonsterStep),
    heroes: (heroUnits || []).map(serializeHeroStep),
  }
}

function findMonsterTemplateByName(name) {
  if (!name) return null
  for (const pool of Object.values(MAP_MONSTER_POOLS)) {
    for (const template of pool.normal || []) {
      if (template.name === name || template.id === name) return template
    }
    const elites = Array.isArray(pool.elite) ? pool.elite : pool.elite ? [pool.elite] : []
    for (const template of elites) {
      if (template.name === name || template.id === name) return template
    }
    if (pool.boss && (pool.boss.name === name || pool.boss.id === name)) return pool.boss
  }
  return null
}

function parseMonsterTypeIdFromUnitId(unitId) {
  if (!unitId || typeof unitId !== 'string') return null
  let best = null
  for (const pool of Object.values(MAP_MONSTER_POOLS)) {
    for (const template of [...(pool.normal || []), ...(Array.isArray(pool.elite) ? pool.elite : pool.elite ? [pool.elite] : []), ...(pool.boss ? [pool.boss] : [])]) {
      const id = template.id
      if (!id) continue
      if (unitId === id || unitId.startsWith(`${id}-`)) {
        if (!best || id.length > best.length) best = id
      }
    }
  }
  return best
}

function findMonsterTemplate(name, unitId) {
  return findMonsterTemplateByName(name) ?? findMonsterTemplateByName(parseMonsterTypeIdFromUnitId(unitId))
}

/**
 * @param {object} encounter
 * @param {object} step
 * @returns {{ monsters: object[], heroes: object[] }}
 */
export function mergeEncounterWithStep(encounter, step) {
  const enc = encounter || { monsters: [], heroes: [] }
  const st = step || { monsters: [], heroes: [] }
  const monsterById = new Map((st.monsters || []).map((m) => [m.id, m]))
  const heroById = new Map((st.heroes || []).map((h) => [h.id, h]))
  return {
    monsters: (enc.monsters || []).map((m) => {
      const patch = monsterById.get(m.id)
      if (!patch) return { ...m, debuffs: m.debuffs || [] }
      return {
        ...m,
        maxHP: patch.maxHP ?? m.maxHP,
        currentHP: patch.currentHP ?? m.currentHP,
        debuffs: patch.debuffs ?? m.debuffs ?? [],
        taunt: patch.taunt !== undefined ? patch.taunt : m.taunt,
        shield: patch.shield !== undefined ? patch.shield : m.shield,
      }
    }),
    heroes: (enc.heroes || []).map((h) => {
      const patch = heroById.get(h.id)
      if (!patch) return { ...h, debuffs: h.debuffs || [], buffs: h.buffs || [] }
      return {
        ...h,
        maxHP: patch.maxHP ?? h.maxHP,
        currentHP: patch.currentHP ?? h.currentHP,
        maxMP: patch.maxMP ?? h.maxMP,
        currentMP: patch.currentMP ?? h.currentMP,
        debuffs: patch.debuffs ?? h.debuffs ?? [],
        buffs: patch.buffs ?? h.buffs ?? [],
        shield: patch.shield !== undefined ? patch.shield : h.shield,
      }
    }),
  }
}

/**
 * @param {object} monster
 * @returns {object}
 */
export function enrichMonsterForDetail(monster) {
  const template = findMonsterTemplate(monster.name, monster.id)
  if (!template) {
    return { ...monster, damageType: monster.damageType ?? 'physical' }
  }
  const tier = monster.tier || 'normal'
  const level = monster.level ?? 1
  const created = createMonster(template, { tier, level })
  return {
    ...created,
    ...monster,
    id: monster.id,
    damageType: monster.damageType ?? created.damageType ?? 'physical',
    physAtk: monster.physAtk ?? created.physAtk,
    spellPower: monster.spellPower ?? created.spellPower,
    agility: monster.agility ?? created.agility,
    currentHP: monster.currentHP ?? created.maxHP,
    maxHP: monster.maxHP ?? created.maxHP,
  }
}

/**
 * Apply authoritative step state to panel rows (mutates refs via return values).
 * @param {object} encounter
 * @param {object} step
 * @param {{ monsters: object[], heroes: object[] }} panel
 */
export function applyPanelStateFromStep(encounter, step, panel) {
  const merged = mergeEncounterWithStep(encounter, step)
  return {
    monsters: merged.monsters.map((m) => ({ ...m, debuffs: m.debuffs || [] })),
    heroes: merged.heroes.map((h) => ({ ...h, debuffs: h.debuffs || [], buffs: h.buffs || [] })),
  }
}

/** Silent log types: no battle log line, no SFX. */
export const SILENT_COMBAT_LOG_TYPES = new Set(['roundMaintenance'])

export function isSilentCombatLogEntry(entry) {
  return entry != null && SILENT_COMBAT_LOG_TYPES.has(entry.type)
}

/** Whether to show a round separator after this log index (roundMaintenance ends a round). */
export function shouldShowRoundSeparatorAfterEntry(entry, nextEntry) {
  if (!entry) return false
  if (entry.type === 'roundMaintenance') return true
  if (!nextEntry) return true
  if (nextEntry.type === 'roundMaintenance') return false
  return nextEntry.round !== entry.round
}

export function parseLogBatchPayload(body) {
  if (!body || typeof body !== 'object') {
    return { log: null, encounter: null, steps: null }
  }
  return normalizeLogBatchPayload({ event: body })
}

function parseStreamEventBody(msg) {
  let body = msg?.event ?? msg
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return null
    }
  }
  return body && typeof body === 'object' ? body : null
}

export function normalizeLogBatchPayload(msg) {
  const body = parseStreamEventBody(msg)
  if (!body) return { log: null, encounter: null, steps: null }
  const payload = body.payload ?? body
  let log = payload?.log
  if (typeof log === 'string') {
    try {
      log = JSON.parse(log)
    } catch {
      log = null
    }
  }
  const encounter = payload?.encounter ?? null
  let steps = payload?.steps
  if (typeof steps === 'string') {
    try {
      steps = JSON.parse(steps)
    } catch {
      steps = null
    }
  }
  return {
    log: Array.isArray(log) ? log : null,
    encounter: encounter && typeof encounter === 'object' ? encounter : null,
    steps: Array.isArray(steps) ? steps : null,
  }
}

export { deepCopy as deepCopyCombatState }
