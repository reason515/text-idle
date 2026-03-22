/**
 * Hero roster names may use a middle dot between given and family name (e.g. "A·B").
 * UI shows only the given name (segment before the first middle dot) for compact layout.
 */
const HERO_NAME_SEP = '\u00b7'

export function heroDisplayName(fullName) {
  if (typeof fullName !== 'string' || fullName.length === 0) {
    return fullName == null ? '' : String(fullName)
  }
  const i = fullName.indexOf(HERO_NAME_SEP)
  if (i === -1) return fullName
  const first = fullName.slice(0, i).trim()
  return first.length > 0 ? first : fullName
}
