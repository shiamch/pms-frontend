'use client'

import { EditOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Statistic } from 'antd'
import Link from 'next/link'
import { listBlogs } from '@/lib/admin/blogs-api'
import type { BlogStatus } from '@/types/blog'

const useCount = (status: BlogStatus) =>
    useQuery({
        queryKey: ['blogs', { currentPage: 1, perPage: 1, status }],
        queryFn: () => listBlogs({ currentPage: 1, perPage: 1, status }),
        select: (page) => page.total,
    })

/** Draft and published counts plus a shortcut to write a post. */
export const DashboardStats = () => {
    const drafts = useCount('draft')
    const published = useCount('published')
    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card>
                    <Statistic title="Published posts" value={published.data ?? '—'} loading={published.isPending} />
                </Card>
                <Card>
                    <Statistic title="Drafts" value={drafts.data ?? '—'} loading={drafts.isPending} />
                </Card>
            </div>
            <Link href="/admin/blogs/new" className="mt-4 inline-block">
                <Button type="primary" icon={<EditOutlined />}>
                    Write a new post
                </Button>
            </Link>
        </>
    )
}
