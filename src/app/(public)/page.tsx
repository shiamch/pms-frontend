import Link from 'next/link'
import { Suspense } from 'react'
import { LoadError } from '@/components/public/LoadError'
import { PostList } from '@/components/public/PostCard'
import { env } from '@/lib/env'
import { listPublishedPosts } from '@/lib/public-api'

const LatestPosts = async () => {
    const result = await listPublishedPosts({})
    if (!result) return <LoadError />
    if (result.data.length === 0) return <p className="text-neutral-600">No posts yet.</p>
    return (
        <>
            <PostList posts={result.data} />
            {result.total > result.data.length && (
                <Link href="/blog" className="mt-4 inline-block font-medium hover:underline">
                    All posts →
                </Link>
            )}
        </>
    )
}

const HomePage = () => (
    <>
        <section className="pb-6">
            <h1 className="text-3xl font-bold tracking-tight break-words sm:text-4xl">
                {env.siteName}
            </h1>
            <p className="mt-2 text-neutral-600">Notes, ideas and things I&apos;m building.</p>
        </section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Latest posts</h2>
        <Suspense fallback={<p className="py-6 text-neutral-500">Loading posts…</p>}>
            <LatestPosts />
        </Suspense>
    </>
)

export default HomePage
