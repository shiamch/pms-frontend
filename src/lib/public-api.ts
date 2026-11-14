import { cacheLife, cacheTag } from 'next/cache'
import { env } from '@/lib/env'
import type { Blog, Paginated } from '@/types/blog'

export const PAGE_SIZE = 10
const TIMEOUT_MS = 5000

type FetchResult<T> = { ok: true; data: T } | { ok: false; status: number | null }

const getJson = async <T>(path: string): Promise<FetchResult<T>> => {
    try {
        const res = await fetch(`${env.backendApiUrl}${path}`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        if (!res.ok) return { ok: false, status: res.status }
        return { ok: true, data: (await res.json()) as T }
    } catch {
        return { ok: false, status: null }
    }
}

/**
 * Lists published posts for visitors. Returns null when the backend fails,
 * so pages can show an error state instead of crashing.
 * Successful results are cached for about a minute; failures only for seconds.
 */
export const listPublishedPosts = async ({
    page = 1,
    q,
}: {
    page?: number
    q?: string
}): Promise<Paginated<Blog> | null> => {
    'use cache'
    cacheTag('posts')
    const params = new URLSearchParams({
        currentPage: String(page),
        perPage: String(PAGE_SIZE),
    })
    const query = q?.trim()
    if (query) params.set('q', query)

    const result = await getJson<Paginated<Blog>>(`/blogs?${params}`)
    if (!result.ok) {
        cacheLife('seconds')
        return null
    }
    cacheLife('minutes')
    return result.data
}

/**
 * Gets one published post by slug.
 * Returns the post, null when it does not exist, or 'error' when the backend fails.
 */
export const getPublishedPost = async (slug: string): Promise<Blog | null | 'error'> => {
    'use cache'
    cacheTag('posts', `post:${slug}`)
    const result = await getJson<Blog>(`/blogs/${encodeURIComponent(slug)}`)
    if (result.ok) {
        cacheLife('minutes')
        return result.data
    }
    cacheLife('seconds')
    return result.status === 404 ? null : 'error'
}
