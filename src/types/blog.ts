export type BlogStatus = 'draft' | 'published'

export interface Blog {
    id: number
    title: string
    slug: string
    excerpt: string | null
    content: string
    status: BlogStatus
    publishedAt: string | null
    createdAt: string
    updatedAt: string
}

export interface Paginated<T> {
    data: T[]
    total: number
    currentPage: number
    perPage: number
}
