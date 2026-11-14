import { describe, expect, it } from 'vitest'
import { safeReturnTo } from './return-to'

describe('safeReturnTo', () => {
    it('keeps admin paths', () => {
        expect(safeReturnTo('/admin/blogs')).toBe('/admin/blogs')
        expect(safeReturnTo('/admin/blogs?status=draft')).toBe(
            '/admin/blogs?status=draft',
        )
    })

    it.each([
        null,
        undefined,
        '',
        '/blog',
        '//evil.com',
        'https://evil.com',
        '/admin/../x',
        '/admin\\evil',
        'javascript:alert(1)',
        '/administrator',
        '/admin/login',
    ])('falls back to /admin for %s', (value) => {
        expect(safeReturnTo(value)).toBe('/admin')
    })
})
