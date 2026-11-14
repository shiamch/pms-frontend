import type { Metadata } from 'next'
import { BlogEditor } from '@/components/admin/blogs/BlogEditor'

export const metadata: Metadata = { title: 'Edit post' }

const EditBlogPage = async ({ params }: PageProps<'/admin/blogs/[id]/edit'>) => {
    const { id } = await params
    return <BlogEditor id={Number(id)} />
}

export default EditBlogPage
