import type { MetadataRoute } from 'next'
import { env } from '@/lib/env'

/** robots.txt: index the public site, keep crawlers out of the admin panel. */
const robots = (): MetadataRoute.Robots => ({
    rules: { userAgent: '*', allow: '/', disallow: ['/admin'] },
    sitemap: `${env.siteUrl}/sitemap.xml`,
})

export default robots
