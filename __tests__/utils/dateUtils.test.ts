/**
 * Unit tests for utils/dateUtils
 */
import { formatDate, formatDateDisplay } from '@/utils/dateUtils'

describe('formatDate', () => {
  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatDate('')).toBe('')
  })

  it('formats valid ISO date string', () => {
    const result = formatDate('2005-06-29')
    expect(result).toMatch(/June.*2005/)
  })

  it('handles invalid date string', () => {
    const result = formatDate('not-a-date')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('formatDateDisplay', () => {
  it('returns N/A for undefined', () => {
    expect(formatDateDisplay(undefined)).toBe('N/A')
  })

  it('returns N/A for empty string', () => {
    expect(formatDateDisplay('')).toBe('N/A')
  })

  it('formats valid ISO date string', () => {
    const result = formatDateDisplay('2005-06-29')
    expect(result).toMatch(/June.*2005/)
  })

  it('handles invalid date string', () => {
    const result = formatDateDisplay('invalid')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
