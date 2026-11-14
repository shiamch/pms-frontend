import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'
import { listPublishedPosts } from '@/lib/public-api'
import type { Blog } from '@/types/blog'

const MAX_PAGES = 100

const allPublishedPosts = async () => {
    const posts: Blog[] = []
    for (let page = 1; page <= MAX_PAGES; page += 1) {
        const result = await listPublishedPosts({ page })
        if (!result) break
        posts.push(...result.data)
        if (page * result.perPage >= result.total) break
    }
    return posts
}

/** sitemap.xml with the home page, the blog index and every published post. */
const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
    const posts = await allPublishedPosts()
    return [
        { url: env.siteUrl, changeFrequency: 'weekly', priority: 1 },
        { url: `${env.siteUrl}/blog`, changeFrequency: 'daily', priority: 0.8 },
        ...posts.map((post) => ({
            url: `${env.siteUrl}/blog/${post.slug}`,
            lastModified: post.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        })),
    ]
}

export default sitemap
