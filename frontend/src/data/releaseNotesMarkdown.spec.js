import { describe, it, expect } from 'vitest'
import { APP_VERSION, APP_VERSION_LABEL } from './version.js'
import { getCurrentReleaseNotes, parseReleaseNotesMarkdown } from './releaseNotesMarkdown.js'

describe('version', () => {
  it('exposes v0.1.0 label', () => {
    expect(APP_VERSION).toBe('0.1.0')
    expect(APP_VERSION_LABEL).toBe('v0.1.0')
  })
})

describe('releaseNotesMarkdown', () => {
  it('parses docs/releases/v0.1.0.md sections', () => {
    const release = getCurrentReleaseNotes()
    expect(release.version).toBe('0.1.0')
    expect(release.date).toBe('2026-06-21')
    expect(release.sections.some((s) => s.title === '账号与存档')).toBe(true)
    expect(release.sections.find((s) => s.title === '探索与战斗')?.items).toContain(
      '五张地图：艾尔文森林、西部荒野、暮色森林、赤脊山、荆棘谷',
    )
  })

  it('collects summary paragraph before first section', () => {
    const parsed = parseReleaseNotesMarkdown(`# v0.2.0 — Test

**发布日期：** 2026-01-01
**代号：** Alpha

Summary line one.

## Features

- First item
`)
    expect(parsed.summary).toContain('Summary line one.')
    expect(parsed.sections[0].items).toEqual(['First item'])
  })
})
