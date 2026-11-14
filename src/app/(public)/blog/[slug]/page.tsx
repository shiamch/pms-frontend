import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LoadError } from '@/components/public/LoadError'
import { formatDate } from '@/lib/format-date'
import { Markdown } from '@/lib/markdown/Markdown'
import { toDescription } from '@/lib/markdown/describe'
import { getPublishedPost } from '@/lib/public-api'

// Cache Components needs at least one param at build time. Real slugs render
// on first request and are then cached, so the build never calls the backend.
export const generateStaticParams = () => [{ slug: '__placeholder__' }]

// Render the whole post before flushing, so crawlers get the full article at once.
// Missing posts still answer 200 with a noindex meta (Cache Components streams the
// shell first), which keeps them out of search results.
export const instant = false

export const generateMetadata = async ({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> => {
    const { slug } = await params
    const post = await getPublishedPost(slug)
    if (!post || post === 'error') return { title: 'Post not found', robots: { index: false } }

    const description = toDescription(post.content, post.excerpt)
    const url = `/blog/${post.slug}`
    return {
        title: post.title,
        description,
        alternates: { canonical: url },
        openGraph: {
            type: 'article',
            url,
            title: post.title,
            description,
            publishedTime: post.publishedAt ?? undefined,
            modifiedTime: post.updatedAt,
        },
        twitter: { card: 'summary_large_image', title: post.title, description },
    }
}

const PostPage = async ({ params }: PageProps<'/blog/[slug]'>) => {
    const { slug } = await params
    const post = await getPublishedPost(slug)
    if (post === null) notFound()
    if (post === 'error') return <LoadError message="Couldn't load this post right now. Please try again later." />

    return (
        <article>
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight break-words sm:text-4xl">{post.title}</h1>
                {post.publishedAt && (
                    <time dateTime={post.publishedAt} className="mt-2 block text-neutral-500">
                        {formatDate(post.publishedAt)}
                    </time>
                )}
            </header>
            <Markdown content={post.content} />
        </article>
    )
}

export default PostPage
