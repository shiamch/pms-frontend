import { describe, expect, it } from 'vitest'
import { shouldRedirectToLogin } from './gate'

describe('shouldRedirectToLogin', () => {
    it('redirects admin pages without auth cookies', () => {
        expect(shouldRedirectToLogin('/admin', [])).toBe(true)
        expect(shouldRedirectToLogin('/admin/blogs/1/edit', ['theme'])).toBe(true)
    })

    it('lets the request through when a refresh or access cookie exists', () => {
        expect(shouldRedirectToLogin('/admin', ['refreshToken'])).toBe(false)
        expect(shouldRedirectToLogin('/admin', ['accessToken'])).toBe(false)
    })

    it('never redirects the login page or public pages', () => {
        expect(shouldRedirectToLogin('/admin/login', [])).toBe(false)
        expect(shouldRedirectToLogin('/blog', [])).toBe(false)
    })
})
