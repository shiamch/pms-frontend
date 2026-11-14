import type { Metadata } from 'next'
import { BlogForm } from '@/components/admin/blogs/BlogForm'

export const metadata: Metadata = { title: 'New post' }

const NewBlogPage = () => (
    <>
        <h1 className="mb-4 text-2xl font-semibold">New post</h1>
        <BlogForm />
    </>
)

export default NewBlogPage
