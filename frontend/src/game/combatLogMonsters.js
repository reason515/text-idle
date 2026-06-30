/**
 * Reconstruct monster panel rows from a server combat log batch.
 */

import { MAP_MONSTER_POOLS, createMonster } from './combat.js'

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

function allMonsterTemplates() {
  const templates = []
  for (const pool of Object.values(MAP_MONSTER_POOLS)) {
    for (const template of pool.normal || []) templates.push(template)
    const elites = Array.isArray(pool.elite) ? pool.elite : pool.elite ? [pool.elite] : []
    for (const template of elites) templates.push(template)
    if (pool.boss) templates.push(pool.boss)
  }
  return templates
}

function parseMonsterTypeIdFromUnitId(unitId) {
  if (!unitId || typeof unitId !== 'string') return null
  let best = null
  for (const template of allMonsterTemplates()) {
    const id = template.id
    if (!id) continue
    if (unitId === id || unitId.startsWith(`${id}-`)) {
      if (!best || id.length > best.length) best = id
    }
  }
  return best
}

function findMonsterTemplate(name, unitId) {
  return findMonsterTemplateByName(name) ?? findMonsterTemplateByName(parseMonsterTypeIdFromUnitId(unitId))
}

/** Fill combat stats (damage type, atk) from map templates for detail modal / panel. */
export function hydrateMonstersForPanel(monsters) {
  if (!Array.isArray(monsters)) return []
  return monsters.map((m) => {
    const template = findMonsterTemplate(m.name, m.id)
    if (!template) {
      return { ...m, damageType: m.damageType ?? 'physical' }
    }
    const tier = m.tier || 'normal'
    const level = m.level ?? 1
    const created = createMonster(template, { tier, level })
    return {
      ...created,
      ...m,
      id: m.id,
      damageType: m.damageType ?? created.damageType ?? 'physical',
      physAtk: m.physAtk ?? created.physAtk,
      spellPower: m.spellPower ?? created.spellPower,
      agility: m.agility ?? created.agility,
      currentHP: m.currentHP ?? created.maxHP,
      maxHP: m.maxHP ?? created.maxHP,
    }
  })
}

function parseMonsterLevelFromId(id) {
  if (!id || typeof id !== 'string') return 1
  const parts = id.split('-')
  if (parts.length < 3) return 1
  const level = parseInt(parts[parts.length - 2], 10)
  return Number.isFinite(level) && level >= 1 ? level : 1
}

function upsertMonster(map, id, patch) {
  const prev = map.get(id) || { id, debuffs: [] }
  map.set(id, { ...prev, ...patch, id })
}

/**
 * @param {object[]} log
 * @returns {object[]}
 */
export function buildMonstersFromLog(log) {
  if (!Array.isArray(log) || log.length === 0) return []

  /** @type {Map<string, object>} */
  const byId = new Map()

  for (const entry of log) {
    if (!entry || typeof entry !== 'object') continue
    if (entry.actorTier != null && entry.actorId) {
      upsertMonster(byId, entry.actorId, {
        name: entry.actorName || entry.actorId,
        tier: entry.actorTier,
        level: parseMonsterLevelFromId(entry.actorId),
      })
    }
    if (entry.targetTier != null && entry.targetId) {
      upsertMonster(byId, entry.targetId, {
        name: entry.targetName || entry.targetId,
        tier: entry.targetTier,
        level: parseMonsterLevelFromId(entry.targetId),
        maxHP: entry.targetMaxHP,
        currentHP: entry.targetHPAfter ?? entry.targetHPBefore,
      })
    }
  }

  for (const entry of log) {
    if (!entry || typeof entry !== 'object') continue
    if (entry.targetTier == null || !entry.targetId) continue
    const row = byId.get(entry.targetId)
    if (!row) continue
    if (entry.targetMaxHP != null) row.maxHP = entry.targetMaxHP
    if (entry.targetHPAfter != null) row.currentHP = entry.targetHPAfter
    else if (entry.targetHPBefore != null && row.currentHP == null) {
      row.currentHP = entry.targetHPBefore
    }
  }

  return [...byId.values()].map((m) => ({
    ...m,
    maxHP: m.maxHP ?? m.currentHP ?? 1,
    currentHP: m.currentHP ?? m.maxHP ?? 1,
    debuffs: m.debuffs || [],
  }))
}

/**
 * Reset panel monsters to encounter start HP before replaying a server log batch.
 * buildMonstersFromLog returns end-of-battle HP (0 on defeat); replay animates from full.
 * @param {object[]} monsters
 * @returns {object[]}
 */
export function prepareMonstersForLogReplay(monsters) {
  if (!Array.isArray(monsters)) return []
  return monsters.map((m) => {
    const maxHP = Math.max(1, Math.floor(Number(m.maxHP ?? m.currentHP) || 1))
    return {
      ...m,
      maxHP,
      currentHP: maxHP,
      debuffs: m.debuffs || [],
    }
  })
}
