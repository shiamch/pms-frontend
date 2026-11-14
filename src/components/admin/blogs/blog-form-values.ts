import type { BlogInput } from '@/lib/admin/blogs-api'
import type { Blog, BlogStatus } from '@/types/blog'

export interface BlogFormValues {
    title: string
    slug: string
    excerpt: string
    status: BlogStatus
    content: string
}

/** Form values for a new post or an existing one. */
export const toFormValues = (blog?: Blog): BlogFormValues => ({
    title: blog?.title ?? '',
    slug: blog?.slug ?? '',
    excerpt: blog?.excerpt ?? '',
    status: blog?.status ?? 'draft',
    content: blog?.content ?? '',
})

const normalize = (values: BlogFormValues) => ({
    title: values.title.trim(),
    slug: values.slug.trim().toLowerCase(),
    excerpt: values.excerpt.trim() || null,
    status: values.status,
    content: values.content,
})

/** Request body for creating a post. A blank slug lets the backend build one from the title. */
export const toCreateBody = (values: BlogFormValues): BlogInput => {
    const { slug, ...rest } = normalize(values)
    return slug ? { ...rest, slug } : rest
}

/** Only the fields that differ from the saved post, for PATCH. */
export const toUpdateBody = (values: BlogFormValues, saved: Blog): Partial<BlogInput> => {
    const next = normalize(values)
    const body: Partial<BlogInput> = {}
    if (next.title !== saved.title) body.title = next.title
    if (next.content !== saved.content) body.content = next.content
    if (next.excerpt !== saved.excerpt) body.excerpt = next.excerpt
    if (next.status !== saved.status) body.status = next.status
    if (next.slug && next.slug !== saved.slug) body.slug = next.slug
    return body
}
