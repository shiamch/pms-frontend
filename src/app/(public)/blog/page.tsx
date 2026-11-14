import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoadError } from '@/components/public/LoadError'
import { Pagination } from '@/components/public/Pagination'
import { PostList } from '@/components/public/PostCard'
import { SearchForm } from '@/components/public/SearchForm'
import { listPublishedPosts } from '@/lib/public-api'

export const metadata: Metadata = {
    title: 'Blog',
    alternates: { canonical: '/blog' },
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const toPage = (value: string | undefined) => {
    const n = Number(value)
    return Number.isInteger(n) && n > 0 ? n : 1
}

const Results = async ({ searchParams }: PageProps<'/blog'>) => {
    const params = await searchParams
    const q = first(params.q)?.trim() ?? ''
    const page = toPage(first(params.page))
    const result = await listPublishedPosts({ page, q })

    return (
        <>
            <SearchForm q={q} />
            {!result ? (
                <div className="mt-6">
                    <LoadError />
                </div>
            ) : result.data.length === 0 ? (
                <p className="mt-6 text-neutral-600">
                    {q ? `No posts match “${q}”.` : 'No posts yet.'}
                </p>
            ) : (
                <>
                    <PostList posts={result.data} />
                    <Pagination
                        page={page}
                        totalPages={Math.ceil(result.total / result.perPage)}
                        q={q}
                    />
                </>
            )}
        </>
    )
}

const BlogPage = (props: PageProps<'/blog'>) => (
    <>
        <h1 className="mb-6 text-3xl font-bold tracking-tight">Blog</h1>
        <Suspense fallback={<p className="text-neutral-500">Loading posts…</p>}>
            <Results {...props} />
        </Suspense>
    </>
)

export default BlogPage
