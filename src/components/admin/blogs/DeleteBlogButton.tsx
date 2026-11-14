'use client'

import { DeleteOutlined } from '@ant-design/icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App, Button, Popconfirm } from 'antd'
import { deleteBlog } from '@/lib/admin/blogs-api'
import { getErrorMessage } from '@/lib/admin/errors'
import type { Blog } from '@/types/blog'

/** Delete button with a confirmation. Refreshes the post lists when done. */
export const DeleteBlogButton = ({
    blog,
    onDeleted,
    block,
}: {
    blog: Blog
    onDeleted?: () => void
    block?: boolean
}) => {
    const { message } = App.useApp()
    const queryClient = useQueryClient()
    const mutation = useMutation({
        mutationFn: () => deleteBlog(blog.id),
        onSuccess: async () => {
            message.success('Post deleted')
            queryClient.removeQueries({ queryKey: ['blog', blog.id] })
            await queryClient.invalidateQueries({ queryKey: ['blogs'] })
            onDeleted?.()
        },
        onError: (err) => message.error(getErrorMessage(err)),
    })

    return (
        <Popconfirm
            title={`Delete “${blog.title}”?`}
            description="This cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true, loading: mutation.isPending }}
            onConfirm={() => mutation.mutateAsync()}
        >
            <Button danger icon={<DeleteOutlined />} block={block} aria-label={`Delete ${blog.title}`}>
                Delete
            </Button>
        </Popconfirm>
    )
}
