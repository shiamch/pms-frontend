import Link from 'next/link'
import { formatDate } from '@/lib/format-date'
import { toDescription } from '@/lib/markdown/describe'
import type { Blog } from '@/types/blog'

/** One post in a list: title, date and a short description. */
export const PostCard = ({ post }: { post: Blog }) => (
    <article className="py-6">
        <h2 className="text-xl font-semibold break-words">
            <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
            </Link>
        </h2>
        {post.publishedAt && (
            <time dateTime={post.publishedAt} className="mt-1 block text-sm text-neutral-500">
                {formatDate(post.publishedAt)}
            </time>
        )}
        <p className="mt-2 text-neutral-700 break-words">{toDescription(post.content, post.excerpt)}</p>
    </article>
)

/** A list of posts separated by dividers. */
export const PostList = ({ posts }: { posts: Blog[] }) => (
    <div className="divide-y divide-neutral-200">
        {posts.map((post) => (
            <PostCard key={post.id} post={post} />
        ))}
    </div>
)
