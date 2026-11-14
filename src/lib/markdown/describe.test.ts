import { describe, expect, it } from 'vitest'
import { toDescription } from './describe'

describe('toDescription', () => {
    it('prefers the trimmed excerpt', () => {
        expect(toDescription('# x', '  Short  ')).toBe('Short')
    })

    it('builds plain text from markdown', () => {
        expect(toDescription('# Title\n\nHello **world** [link](http://a)', null)).toBe(
            'Title Hello world link',
        )
    })

    it('truncates long text at a word boundary', () => {
        const result = toDescription('word '.repeat(60), null)
        expect(result.length).toBeLessThanOrEqual(161)
        expect(result.endsWith('…')).toBe(true)
    })

    it('returns empty string for empty input', () => {
        expect(toDescription('', null)).toBe('')
    })
})
