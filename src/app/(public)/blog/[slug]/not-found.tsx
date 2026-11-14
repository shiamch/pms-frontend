import Link from 'next/link'

const PostNotFound = () => (
    <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <p className="mt-2 text-neutral-600">It may have been moved or unpublished.</p>
        <Link href="/blog" className="mt-6 inline-block font-medium hover:underline">
            ← Back to blog
        </Link>
    </div>
)

export default PostNotFound
