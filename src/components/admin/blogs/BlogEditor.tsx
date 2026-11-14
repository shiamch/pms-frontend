'use client'

import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Result, Spin } from 'antd'
import { isAxiosError } from 'axios'
import Link from 'next/link'
import { getBlog } from '@/lib/admin/blogs-api'
import { getErrorMessage } from '@/lib/admin/errors'
import { BlogForm } from './BlogForm'

const NotFound = () => (
    <Result
        status="404"
        title="Post not found"
        extra={
            <Link href="/admin/blogs">
                <Button type="primary">Back to posts</Button>
            </Link>
        }
    />
)

/** Loads a post by id and shows the edit form. */
export const BlogEditor = ({ id }: { id: number }) => {
    const valid = Number.isInteger(id) && id > 0
    const query = useQuery({
        queryKey: ['blog', id],
        queryFn: () => getBlog(id),
        enabled: valid,
        retry: (count, err) =>
            !(isAxiosError(err) && err.response?.status === 404) && count < 1,
    })

    if (!valid) return <NotFound />
    if (query.isError) {
        if (isAxiosError(query.error) && query.error.response?.status === 404)
            return <NotFound />
        return <Alert type="error" showIcon title={getErrorMessage(query.error)} />
    }
    if (!query.data) {
        return (
            <div className="flex justify-center py-12">
                <Spin />
            </div>
        )
    }
    return (
        <>
            <h1 className="mb-4 text-2xl font-semibold break-words">Edit post</h1>
            <BlogForm key={query.data.id} blog={query.data} />
        </>
    )
}
