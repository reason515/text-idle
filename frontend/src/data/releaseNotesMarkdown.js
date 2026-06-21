import { APP_VERSION } from './version.js'
import releaseNotesV010 from '../../../docs/releases/v0.1.0.md?raw'

/** @type {Record<string, string>} */
const RELEASE_NOTES_RAW_BY_VERSION = {
  '0.1.0': releaseNotesV010,
}

/**
 * @typedef {{ version: string, label: string, title: string, codename: string, date: string, summary: string, sections: Array<{ title: string, items: string[] }> }} ParsedReleaseNote
 */

/**
 * Parse a release notes markdown file (docs/releases/vX.Y.Z.md shape).
 * @param {string} markdown
 * @returns {ParsedReleaseNote}
 */
export function parseReleaseNotesMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let title = ''
  let date = ''
  let codename = ''
  const summaryLines = []
  /** @type {Array<{ title: string, items: string[] }>} */
  const sections = []

  let phase = 'header'
  /** @type {{ title: string, items: string[] } | null} */
  let currentSection = null

  for (const line of lines) {
    const trimmed = line.trim()

    if (!title && trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim()
      continue
    }

    if (!date) {
      const dateMatch = trimmed.match(/^\*\*发布日期：\*\*\s*(.+)$/)
      if (dateMatch) {
        date = dateMatch[1].trim()
        continue
      }
    }

    if (!codename) {
      const codenameMatch = trimmed.match(/^\*\*代号：\*\*\s*(.+)$/)
      if (codenameMatch) {
        codename = codenameMatch[1].trim()
        continue
      }
    }

    if (trimmed.startsWith('## ')) {
      phase = 'sections'
      if (currentSection) sections.push(currentSection)
      currentSection = { title: trimmed.slice(3).trim(), items: [] }
      continue
    }

    if (phase === 'header' && trimmed && !trimmed.startsWith('**')) {
      summaryLines.push(trimmed)
      continue
    }

    if (phase === 'sections' && currentSection && trimmed.startsWith('- ')) {
      currentSection.items.push(trimmed.slice(2).trim())
    }
  }

  if (currentSection) sections.push(currentSection)

  const versionFromTitle = title.match(/v(\d+\.\d+\.\d+)/i)?.[1] ?? APP_VERSION

  return {
    version: versionFromTitle,
    label: `v${versionFromTitle}`,
    title,
    codename,
    date,
    summary: summaryLines.join(' '),
    sections,
  }
}

/** @returns {ParsedReleaseNote} */
export function getCurrentReleaseNotes() {
  const raw = RELEASE_NOTES_RAW_BY_VERSION[APP_VERSION]
  if (!raw) {
    throw new Error(`Missing release notes markdown for version ${APP_VERSION}`)
  }
  return parseReleaseNotesMarkdown(raw)
}
