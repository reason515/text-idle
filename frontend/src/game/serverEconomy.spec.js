import { describe, expect, it } from 'vitest'
import { applyShopBuyToSave, applySellItemToSave } from './serverEconomy.js'

describe('serverEconomy', () => {
  it('applyShopBuyToSave deducts gold and adds item', () => {
    const save = { gold: 5000, squad: [{ level: 5 }], inventory: [] }
    const result = applyShopBuyToSave(save, 'Helm', () => 0.5)
    expect(result.success).toBe(true)
    expect(result.save.gold).toBeLessThan(5000)
    expect(result.save.inventory).toHaveLength(1)
  })

  it('applySellItemToSave adds gold and removes item', () => {
    const item = {
      id: 'sell-me',
      slot: 'Helm',
      quality: 'normal',
      itemTier: 'normal',
    }
    const save = { gold: 100, inventory: [item] }
    const result = applySellItemToSave(save, 'sell-me')
    expect(result.success).toBe(true)
    expect(result.save.inventory).toHaveLength(0)
    expect(result.save.gold).toBeGreaterThan(100)
  })
})
