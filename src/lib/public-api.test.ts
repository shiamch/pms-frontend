import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

const backend = 'http://api.test/api/v1'

const jsonResponse = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })

const load = async () => {
    vi.resetModules()
    return import('./public-api')
}

describe('public-api', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
        vi.stubEnv('BACKEND_API_URL', backend)
        vi.stubGlobal('fetch', fetchMock)
    })

    afterEach(() => {
        fetchMock.mockReset()
        vi.unstubAllEnvs()
        vi.unstubAllGlobals()
    })

    it('lists posts with page, perPage and query', async () => {
        const page = { data: [], total: 0, currentPage: 2, perPage: 10 }
        fetchMock.mockResolvedValue(jsonResponse(page))
        const { listPublishedPosts } = await load()

        await expect(listPublishedPosts({ page: 2, q: 'react' })).resolves.toEqual(page)
        expect(String(fetchMock.mock.calls[0][0])).toBe(
            `${backend}/blogs?currentPage=2&perPage=10&q=react`,
        )
    })

    it('omits an empty query', async () => {
        fetchMock.mockResolvedValue(jsonResponse({ data: [] }))
        const { listPublishedPosts } = await load()

        await listPublishedPosts({ q: '  ' })
        expect(String(fetchMock.mock.calls[0][0])).toBe(
            `${backend}/blogs?currentPage=1&perPage=10`,
        )
    })

    it('returns null when the list request fails', async () => {
        const { listPublishedPosts } = await load()
        fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'))
        await expect(listPublishedPosts({})).resolves.toBeNull()
        fetchMock.mockResolvedValueOnce(jsonResponse({}, 500))
        await expect(listPublishedPosts({})).resolves.toBeNull()
    })

    it('gets a post by encoded slug', async () => {
        const post = { id: 1, slug: 'a b' }
        fetchMock.mockResolvedValue(jsonResponse(post))
        const { getPublishedPost } = await load()

        await expect(getPublishedPost('a b')).resolves.toEqual(post)
        expect(String(fetchMock.mock.calls[0][0])).toBe(`${backend}/blogs/a%20b`)
    })

    it('distinguishes not found from errors', async () => {
        const { getPublishedPost } = await load()
        fetchMock.mockResolvedValueOnce(jsonResponse({}, 404))
        await expect(getPublishedPost('x')).resolves.toBeNull()
        fetchMock.mockResolvedValueOnce(jsonResponse({}, 500))
        await expect(getPublishedPost('x')).resolves.toBe('error')
        fetchMock.mockRejectedValueOnce(new Error('down'))
        await expect(getPublishedPost('x')).resolves.toBe('error')
    })
})
