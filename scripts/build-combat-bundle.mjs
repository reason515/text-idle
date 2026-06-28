/**
 * Bundle serverCombatCycle for goja embed in Go binary.
 * Usage: node scripts/build-combat-bundle.mjs
 */
import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'internal', 'combat', 'embed')
mkdirSync(outDir, { recursive: true })

await build({
  entryPoints: [join(root, 'frontend', 'src', 'game', 'serverCombatCycle.js')],
  bundle: true,
  platform: 'neutral',
  format: 'iife',
  globalName: 'TextIdleCombat',
  outfile: join(outDir, 'combat.bundle.js'),
  logLevel: 'info',
  define: {
    'import.meta.env.MODE': '"production"',
    'import.meta.env.DEV': 'false',
  },
})

console.log('combat bundle written to internal/combat/embed/combat.bundle.js')
