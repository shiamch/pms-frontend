'use client'

import { EditOutlined, PlusOutlined } from '@ant-design/icons'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Alert, Button, Empty, Grid, Pagination, Space, Spin, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import Link from 'next/link'
import { useState } from 'react'
import { listBlogs } from '@/lib/admin/blogs-api'
import { getErrorMessage } from '@/lib/admin/errors'
import { useDebouncedValue } from '@/lib/admin/use-debounced-value'
import { formatDate } from '@/lib/format-date'
import type { Blog } from '@/types/blog'
import { BlogCardList } from './BlogCardList'
import { BlogsFilter, type StatusFilter } from './BlogsFilter'
import { DeleteBlogButton } from './DeleteBlogButton'
import { StatusTag } from './StatusTag'

const PER_PAGE = 10

const columns: ColumnsType<Blog> = [
    {
        title: 'Title',
        dataIndex: 'title',
        render: (title: string, blog) => (
            <Link
                href={`/admin/blogs/${blog.id}/edit`}
                className="font-medium break-words"
            >
                {title}
            </Link>
        ),
    },
    {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        render: (status: Blog['status']) => <StatusTag status={status} />,
    },
    {
        title: 'Published',
        dataIndex: 'publishedAt',
        width: 140,
        render: (date: string | null) => (date ? formatDate(date) : '—'),
    },
    {
        title: 'Updated',
        dataIndex: 'updatedAt',
        width: 140,
        render: (date: string) => formatDate(date),
    },
    {
        title: 'Actions',
        key: 'actions',
        width: 200,
        render: (_, blog) => (
            <Space>
                <Link href={`/admin/blogs/${blog.id}/edit`}>
                    <Button icon={<EditOutlined />}>Edit</Button>
                </Link>
                <DeleteBlogButton blog={blog} />
            </Space>
        ),
    },
]

const EmptyState = ({ filtered }: { filtered: boolean }) => (
    <Empty description={filtered ? 'No posts match your filters' : 'No posts yet'}>
        {!filtered && (
            <Link href="/admin/blogs/new">
                <Button type="primary" icon={<PlusOutlined />}>
                    New post
                </Button>
            </Link>
        )}
    </Empty>
)

/** Admin post list with search, status filter and pagination. Table on desktop, cards on phones. */
export const BlogsList = () => {
    const screens = Grid.useBreakpoint()
    const [q, setQ] = useState('')
    const [status, setStatus] = useState<StatusFilter>('all')
    const [page, setPage] = useState(1)
    const debouncedQ = useDebouncedValue(q.trim(), 400)

    const params = {
        currentPage: page,
        perPage: PER_PAGE,
        ...(debouncedQ ? { q: debouncedQ } : {}),
        ...(status !== 'all' ? { status } : {}),
    }

    const query = useQuery({
        queryKey: ['blogs', params],
        queryFn: () => listBlogs(params),
        placeholderData: keepPreviousData,
    })

    // A search or filter change always starts from the first page.
    const [lastFilters, setLastFilters] = useState({ debouncedQ, status })
    if (lastFilters.debouncedQ !== debouncedQ || lastFilters.status !== status) {
        setLastFilters({ debouncedQ, status })
        setPage(1)
    }

    const blogs = query.data?.data ?? []
    const total = query.data?.total ?? 0
    const filtered = Boolean(debouncedQ) || status !== 'all'

    const renderBody = () => {
        if (query.isError)
            return <Alert type="error" showIcon title={getErrorMessage(query.error)} />
        if (query.isPending) {
            return (
                <div className="flex justify-center py-12">
                    <Spin />
                </div>
            )
        }
        if (blogs.length === 0) return <EmptyState filtered={filtered} />
        if (screens.md) {
            return (
                <Table<Blog>
                    rowKey="id"
                    columns={columns}
                    dataSource={blogs}
                    loading={query.isFetching}
                    pagination={false}
                    scroll={{ x: 760 }}
                />
            )
        }
        return <BlogCardList blogs={blogs} />
    }

    return (
        <>
            <BlogsFilter
                q={q}
                status={status}
                onQChange={setQ}
                onStatusChange={setStatus}
            />
            {renderBody()}
            {total > PER_PAGE && (
                <Pagination
                    className="mt-4 flex justify-end"
                    current={page}
                    pageSize={PER_PAGE}
                    total={total}
                    onChange={setPage}
                    showSizeChanger={false}
                    simple={!screens.md}
                    showTotal={(all, range) => `${range[0]}–${range[1]} of ${all}`}
                />
            )}
        </>
    )
}
