import { describe, it, expect } from 'vitest'
import { APP_VERSION, APP_VERSION_LABEL } from './version.js'
import { getCurrentReleaseNotes, getAllReleaseNotes, parseReleaseNotesMarkdown, parseReleaseNoteInlineSegments } from './releaseNotesMarkdown.js'

describe('version', () => {
  it('exposes v0.1.5 label', () => {
    expect(APP_VERSION).toBe('0.1.5')
    expect(APP_VERSION_LABEL).toBe('v0.1.5')
  })
})

describe('releaseNotesMarkdown', () => {
  it('parses docs/releases/v0.1.5.md sections', () => {
    const release = getCurrentReleaseNotes()
    expect(release.version).toBe('0.1.5')
    expect(release.date).toBe('2026-06-22')
    expect(release.sections.some((s) => s.title === '数据统计')).toBe(true)
    expect(release.sections.find((s) => s.title === '数据统计')?.items).toContain(
      '主界面**战斗趋势图**横轴由「每场战斗回合数」改为**战斗行动步**，与玩家统计系统的步数口径一致',
    )
  })

  it('getAllReleaseNotes returns newest first and includes past versions', () => {
    const all = getAllReleaseNotes()
    expect(all.map((r) => r.version)).toEqual(['0.1.5', '0.1.4', '0.1.3', '0.1.2', '0.1.1', '0.1.0'])
    expect(all[5].sections.some((s) => s.title === '账号与存档')).toBe(true)
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
