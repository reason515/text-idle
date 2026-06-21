import { describe, it, expect } from 'vitest'
import { APP_VERSION, APP_VERSION_LABEL } from './version.js'
import { getCurrentReleaseNotes, getAllReleaseNotes, parseReleaseNotesMarkdown, parseReleaseNoteInlineSegments } from './releaseNotesMarkdown.js'

describe('version', () => {
  it('exposes v0.1.1 label', () => {
    expect(APP_VERSION).toBe('0.1.1')
    expect(APP_VERSION_LABEL).toBe('v0.1.1')
  })
})

describe('releaseNotesMarkdown', () => {
  it('parses docs/releases/v0.1.1.md sections', () => {
    const release = getCurrentReleaseNotes()
    expect(release.version).toBe('0.1.1')
    expect(release.date).toBe('2026-06-21')
    expect(release.sections.some((s) => s.title === '战术 AI 配置')).toBe(true)
    expect(release.sections.find((s) => s.title === '战术 AI 配置')?.items).toContain(
      '进入战术 Tab 时自动填入**场景化自然语言**模板（战士 OT 拉怪、法师血线分段、牧师治疗 triage 等编号句式，而非结构化字段复述）',
    )
  })

  it('getAllReleaseNotes returns newest first and includes past versions', () => {
    const all = getAllReleaseNotes()
    expect(all.map((r) => r.version)).toEqual(['0.1.1', '0.1.0'])
    expect(all[1].sections.some((s) => s.title === '账号与存档')).toBe(true)
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
