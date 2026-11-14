import { Tag } from 'antd'
import type { BlogStatus } from '@/types/blog'

/** Coloured tag for a post status. */
export const StatusTag = ({ status }: { status: BlogStatus }) =>
    status === 'published' ? <Tag color="green">Published</Tag> : <Tag>Draft</Tag>
