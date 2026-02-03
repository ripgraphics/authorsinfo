/**
 * Unit tests for utils/textUtils
 */
import { cleanSynopsis, stripHtml } from '@/utils/textUtils'

describe('cleanSynopsis', () => {
  it('returns empty string for empty input', () => {
    expect(cleanSynopsis('')).toBe('')
  })

  it('replaces br tags with line breaks', () => {
    const input = 'Line one<br/>Line two'
    const result = cleanSynopsis(input)
    expect(result).toContain('Line one')
    expect(result).toContain('Line two')
    expect(result).not.toContain('<br/>')
  })

  it('wraps multiple paragraphs in p tags', () => {
    const input = 'Para 1<br/><br/>Para 2'
    const result = cleanSynopsis(input)
    expect(result).toContain('<p>')
    expect(result).toContain('Para 1')
    expect(result).toContain('Para 2')
  })

  it('returns single paragraph without p tags', () => {
    const input = 'Single paragraph'
    expect(cleanSynopsis(input)).toBe('Single paragraph')
  })
})

describe('stripHtml', () => {
  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('')
  })

  it('strips HTML tags', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello')
  })

  it('strips multiple tags', () => {
    expect(stripHtml('<b>bold</b> and <i>italic</i>')).toBe('bold and italic')
  })

  it('returns plain text unchanged', () => {
    expect(stripHtml('No HTML here')).toBe('No HTML here')
  })
})
