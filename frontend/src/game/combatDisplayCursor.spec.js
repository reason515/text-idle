import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDisplayedEventSeq,
  getActiveLogBatchSeq,
  getLogStepIndex,
  markEventDisplayed,
  initDisplayedEventSeqFromSnapshot,
  setActiveLogBatchSeq,
  resetDisplayedEventSeqForTests,
} from './combatDisplayCursor.js'

describe('combatDisplayCursor', () => {
  beforeEach(() => {
    resetDisplayedEventSeqForTests()
  })

  it('markEventDisplayed keeps the highest seq', () => {
    markEventDisplayed(3)
    markEventDisplayed(2)
    markEventDisplayed(5)
    expect(getDisplayedEventSeq()).toBe(5)
  })

  it('initDisplayedEventSeqFromSnapshot prefers displayedEventSeq', () => {
    initDisplayedEventSeqFromSnapshot({ displayedEventSeq: 4, eventSeq: 9 })
    expect(getDisplayedEventSeq()).toBe(4)
  })

  it('initDisplayedEventSeqFromSnapshot falls back to leave eventSeq', () => {
    initDisplayedEventSeqFromSnapshot({ eventSeq: 7 })
    expect(getDisplayedEventSeq()).toBe(7)
  })

  it('setActiveLogBatchSeq preserves logStepIndex when batch seq unchanged', () => {
    initDisplayedEventSeqFromSnapshot({ logBatchEventSeq: 5, logStepIndex: 9 })
    setActiveLogBatchSeq(5)
    expect(getActiveLogBatchSeq()).toBe(5)
    expect(getLogStepIndex()).toBe(9)
  })

  it('initDisplayedEventSeqFromSnapshot restores log batch resume cursor', () => {
    initDisplayedEventSeqFromSnapshot({ logBatchEventSeq: 5, logStepIndex: 9 })
    expect(getActiveLogBatchSeq()).toBe(5)
    expect(getLogStepIndex()).toBe(9)
  })
})
