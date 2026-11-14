import { afterEach, describe, expect, it, vi } from 'vitest'

const loadEnv = async () => {
    vi.resetModules()
    return (await import('./env')).env
}

describe('env', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('strips the trailing slash from the site url', async () => {
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:5173/')
        expect((await loadEnv()).siteUrl).toBe('http://localhost:5173')
    })

    it('falls back to the public backend url on the server', async () => {
        vi.stubEnv('BACKEND_API_URL', '')
        vi.stubEnv('NEXT_PUBLIC_BACKEND_API_URL', 'http://x/api/v1')
        expect((await loadEnv()).backendApiUrl).toBe('http://x/api/v1')
    })
})
