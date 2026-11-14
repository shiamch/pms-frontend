import type { Blog, BlogStatus, Paginated } from '@/types/blog'
import { api } from './http'

export interface BlogInput {
    title: string
    content: string
    slug?: string
    excerpt?: string | null
    status?: BlogStatus
}

export interface ListBlogsParams {
    currentPage: number
    perPage: number
    q?: string
    status?: BlogStatus
}

/** Lists every post (any status) for the admin. */
export const listBlogs = (params: ListBlogsParams) =>
    api.get<Paginated<Blog>>('/admin/blogs', { params }).then((res) => res.data)

/** Gets one post by id. */
export const getBlog = (id: number) =>
    api.get<Blog>(`/admin/blogs/${id}`).then((res) => res.data)

/** Creates a post. */
export const createBlog = (body: BlogInput) =>
    api.post<Blog>('/admin/blogs', body).then((res) => res.data)

/** Updates only the given fields of a post. */
export const updateBlog = (id: number, body: Partial<BlogInput>) =>
    api.patch<Blog>(`/admin/blogs/${id}`, body).then((res) => res.data)

/** Deletes a post. */
export const deleteBlog = (id: number) =>
    api.delete(`/admin/blogs/${id}`).then(() => undefined)
