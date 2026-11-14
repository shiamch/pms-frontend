import { describe, expect, it, vi } from 'vitest'

describe('robots', () => {
    it('allows the site, blocks the admin panel and links the sitemap', async () => {
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
        vi.resetModules()
        const robots = (await import('./robots')).default
        const result = robots()
        const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
        expect(rules.allow).toBe('/')
        expect(rules.disallow).toContain('/admin')
        expect(result.sitemap).toBe('https://example.com/sitemap.xml')
    })
})
