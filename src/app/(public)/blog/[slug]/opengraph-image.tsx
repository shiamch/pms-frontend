import { ImageResponse } from 'next/og'
import { OgCard, ogSize } from '@/lib/og/OgCard'
import { getPublishedPost } from '@/lib/public-api'

export const alt = 'Blog post'
export const size = ogSize
export const contentType = 'image/png'

/** Share image for one post. Falls back to the site card if the post can't be loaded. */
const Image = async ({ params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params
    const post = await getPublishedPost(slug)
    const title = post && post !== 'error' ? post.title : undefined
    return new ImageResponse(<OgCard title={title} />, size)
}

export default Image
