'use client'

import { PlusOutlined } from '@ant-design/icons'
import { Button, Input, Select } from 'antd'
import Link from 'next/link'
import type { BlogStatus } from '@/types/blog'

export type StatusFilter = BlogStatus | 'all'

/** Search box, status filter and "New post" button. Stacks on phones. */
export const BlogsFilter = ({
    q,
    status,
    onQChange,
    onStatusChange,
}: {
    q: string
    status: StatusFilter
    onQChange: (q: string) => void
    onStatusChange: (status: StatusFilter) => void
}) => (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input.Search
            allowClear
            placeholder="Search by title"
            value={q}
            onChange={(event) => onQChange(event.target.value)}
            className="sm:max-w-xs"
        />
        <Select<StatusFilter>
            aria-label="Status"
            value={status}
            onChange={onStatusChange}
            className="sm:w-40"
            options={[
                { value: 'all', label: 'All statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
            ]}
        />
        <Link href="/admin/blogs/new" className="sm:ml-auto">
            <Button type="primary" icon={<PlusOutlined />} block>
                New post
            </Button>
        </Link>
    </div>
)
