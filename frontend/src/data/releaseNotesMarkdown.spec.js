import { describe, it, expect } from 'vitest'
import { APP_VERSION, APP_VERSION_LABEL } from './version.js'
import { getCurrentReleaseNotes, getAllReleaseNotes, parseReleaseNotesMarkdown, parseReleaseNoteInlineSegments } from './releaseNotesMarkdown.js'

describe('version', () => {
  it('exposes v0.2.0 label', () => {
    expect(APP_VERSION).toBe('0.2.0')
    expect(APP_VERSION_LABEL).toBe('v0.2.0')
  })
})

describe('releaseNotesMarkdown', () => {
  it('parses docs/releases/v0.2.0.md sections', () => {
    const release = getCurrentReleaseNotes()
    expect(release.version).toBe('0.2.0')
    expect(release.date).toBe('2026-06-28')
    expect(release.sections.some((s) => s.title === '挂机推进')).toBe(true)
    expect(release.sections.find((s) => s.title === '挂机推进')?.items).toContain(
      '战斗回合、结算与休息在服务端执行，不再依赖浏览器前台运行',
    )
  })

  it('getAllReleaseNotes returns newest first and includes past versions', () => {
    const all = getAllReleaseNotes()
    expect(all.map((r) => r.version)).toEqual(['0.2.0', '0.1.7', '0.1.6', '0.1.5', '0.1.4', '0.1.3', '0.1.2', '0.1.1', '0.1.0'])
    expect(all[8].sections.some((s) => s.title === '账号与存档')).toBe(true)
  })

  it('parseReleaseNoteInlineSegments renders **bold** as segments', () => {
    expect(parseReleaseNoteInlineSegments('plain **bold** end')).toEqual([
      { kind: 'text', text: 'plain ' },
      { kind: 'strong', text: 'bold' },
      { kind: 'text', text: ' end' },
    ])
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
