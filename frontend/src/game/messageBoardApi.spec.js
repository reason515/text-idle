import { describe, expect, it } from 'vitest'
import { displayTeamName, formatMessageBoardTime } from './messageBoardApi.js'

describe('messageBoardApi', () => {
  describe('displayTeamName', () => {
    it('returns fallback for empty team name', () => {
      expect(displayTeamName('')).toBe('\u672a\u547d\u540d\u961f\u4f0d')
      expect(displayTeamName('   ')).toBe('\u672a\u547d\u540d\u961f\u4f0d')
    })

    it('trims non-empty team name', () => {
      expect(displayTeamName('  Alpha  ')).toBe('Alpha')
    })
  })

  describe('formatMessageBoardTime', () => {
    it('formats ISO timestamp in local YYYY-MM-DD HH:mm', () => {
      const d = new Date(2026, 5, 21, 14, 5)
      expect(formatMessageBoardTime(d)).toBe('2026-06-21 14:05')
    })

    it('returns empty string for invalid input', () => {
      expect(formatMessageBoardTime('not-a-date')).toBe('')
    })
  })
})
