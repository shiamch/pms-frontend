import type { Metadata } from 'next'
import { BlogsList } from '@/components/admin/blogs/BlogsList'

export const metadata: Metadata = { title: 'Blogs' }

const BlogsPage = () => (
    <>
        <h1 className="mb-4 text-2xl font-semibold">Blogs</h1>
        <BlogsList />
    </>
)

export default BlogsPage
