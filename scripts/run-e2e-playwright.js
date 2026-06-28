/**
 * Playwright launcher for E2E.
 * Optional env: E2E_PLAYWRIGHT_GREP, E2E_WORKERS (overrides --workers=).
 */
const { spawnSync } = require('child_process')
const path = require('path')

const repoRoot = path.join(__dirname, '..')
const grepFile = path.join(repoRoot, '.e2e-grep.txt')
const playwrightArgs = ['test', '--config=e2e/browser/playwright.config.js']

const workersEnv = process.env.E2E_WORKERS
if (workersEnv) {
  playwrightArgs.push('--workers', String(workersEnv))
}

const fs = require('fs')
if (fs.existsSync(grepFile)) {
  const pattern = fs.readFileSync(grepFile, 'utf8').trim()
  if (pattern) playwrightArgs.push('--grep', pattern)
} else if (process.env.E2E_PLAYWRIGHT_GREP) {
  playwrightArgs.push('--grep', process.env.E2E_PLAYWRIGHT_GREP)
}

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith('--workers=')) {
    playwrightArgs.push('--workers', arg.slice('--workers='.length))
  } else if (arg === '--grep') {
    continue
  } else if (!process.env.E2E_PLAYWRIGHT_GREP && arg.startsWith('--grep=')) {
    playwrightArgs.push('--grep', arg.slice('--grep='.length))
  } else if (arg.startsWith('--')) {
    playwrightArgs.push(arg)
  }
}

const playwrightCli = path.join(repoRoot, 'node_modules', '@playwright', 'test', 'cli.js')
const runner = fs.existsSync(playwrightCli) ? process.execPath : (process.platform === 'win32' ? 'npx.cmd' : 'npx')
const runnerArgs = fs.existsSync(playwrightCli)
  ? [playwrightCli, ...playwrightArgs]
  : ['playwright', ...playwrightArgs]

const result = spawnSync(runner, runnerArgs, {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: false,
  windowsHide: true,
})

process.exit(result.status ?? 1)
