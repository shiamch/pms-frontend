'use client'

import { EditOutlined } from '@ant-design/icons'
import { Button, Card } from 'antd'
import Link from 'next/link'
import { formatDate } from '@/lib/format-date'
import type { Blog } from '@/types/blog'
import { DeleteBlogButton } from './DeleteBlogButton'
import { StatusTag } from './StatusTag'

/** Phone layout for the post list: one card per post. */
export const BlogCardList = ({ blogs }: { blogs: Blog[] }) => (
    <div className="flex flex-col gap-3">
        {blogs.map((blog) => (
            <Card key={blog.id} size="small">
                <Link href={`/admin/blogs/${blog.id}/edit`} className="block font-medium break-words text-neutral-900">
                    {blog.title}
                </Link>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                    <StatusTag status={blog.status} />
                    <span>Updated {formatDate(blog.updatedAt)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link href={`/admin/blogs/${blog.id}/edit`}>
                        <Button icon={<EditOutlined />} block>
                            Edit
                        </Button>
                    </Link>
                    <DeleteBlogButton blog={blog} block />
                </div>
            </Card>
        ))}
    </div>
)
