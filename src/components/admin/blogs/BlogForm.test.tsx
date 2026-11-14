import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Blog } from '@/types/blog'
import { AdminProviders } from '../AdminProviders'
import { BlogForm } from './BlogForm'

const replace = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace }),
    usePathname: () => '/admin/blogs/new',
}))

vi.mock('./MarkdownField', () => ({
    MarkdownField: ({ value, onChange }: { value?: string; onChange?: (v: string) => void }) => (
        <textarea aria-label="Content" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} />
    ),
}))

const blogsApi = vi.hoisted(() => ({
    listBlogs: vi.fn(),
    getBlog: vi.fn(),
    createBlog: vi.fn(),
    updateBlog: vi.fn(),
    deleteBlog: vi.fn(),
}))
vi.mock('@/lib/admin/blogs-api', () => blogsApi)

const published: Blog = {
    id: 7,
    title: 'Hello',
    slug: 'hello',
    excerpt: null,
    content: 'Body',
    status: 'published',
    publishedAt: '2026-11-01T00:00:00Z',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
}

const validationError = (path: string, msg: string) => {
    const config = { headers: new AxiosHeaders() }
    return new AxiosError('fail', 'ERR', config, undefined, {
        status: 400,
        data: { errors: [{ type: 'field', path, msg, location: 'body' }] },
        statusText: '',
        headers: {},
        config,
    })
}

const renderForm = (blog?: Blog) =>
    render(
        <AdminProviders>
            <BlogForm blog={blog} />
        </AdminProviders>,
    )

const save = () => userEvent.click(screen.getAllByRole('button', { name: /save/i })[0])

describe('BlogForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('requires title and content', async () => {
        renderForm()
        await save()
        expect(await screen.findByText('Title is required')).toBeInTheDocument()
        expect(screen.getByText('Content is required')).toBeInTheDocument()
        expect(blogsApi.createBlog).not.toHaveBeenCalled()
    })

    it('creates a post without a blank slug and opens the editor', async () => {
        blogsApi.createBlog.mockResolvedValue({ ...published, id: 9, status: 'draft' })
        renderForm()
        await userEvent.type(screen.getByLabelText('Title'), 'My post')
        fireEvent.change(screen.getByLabelText('Content'), { target: { value: '# Hi' } })
        await save()

        await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/blogs/9/edit'))
        expect(blogsApi.createBlog).toHaveBeenCalledWith({
            title: 'My post',
            content: '# Hi',
            excerpt: null,
            status: 'draft',
        })
    })

    it('tells the owner when the backend changed the slug', async () => {
        blogsApi.updateBlog.mockResolvedValue({ ...published, status: 'draft', slug: 'taken-2' })
        renderForm({ ...published, status: 'draft' })
        const slug = screen.getByLabelText('Slug')
        await userEvent.clear(slug)
        await userEvent.type(slug, 'taken')
        await save()

        expect(await screen.findByText('Saved with slug “taken-2” because “taken” was taken.')).toBeInTheDocument()
        expect(blogsApi.updateBlog).toHaveBeenCalledWith(7, { slug: 'taken' })
    })

    it('locks the slug of a published post until confirmed', async () => {
        renderForm(published)
        expect(screen.getByLabelText('Slug')).toBeDisabled()
        await userEvent.click(screen.getByRole('button', { name: /edit slug/i }))
        expect(
            await screen.findByText(
                'Changing the slug of a published post breaks its existing links and search results.',
            ),
        ).toBeInTheDocument()
        await userEvent.click(screen.getByRole('button', { name: /change slug/i }))
        await waitFor(() => expect(screen.getByLabelText('Slug')).not.toBeDisabled())
    })

    it('shows backend field errors and keeps typed values', async () => {
        blogsApi.updateBlog.mockRejectedValue(validationError('title', 'Title must be at most 200 characters'))
        renderForm(published)
        const title = screen.getByLabelText('Title')
        await userEvent.clear(title)
        await userEvent.type(title, 'New title')
        await save()

        expect(await screen.findByText('Title must be at most 200 characters')).toBeInTheDocument()
        expect(screen.getByLabelText('Title')).toHaveValue('New title')
    })

    it('shows other errors and keeps typed values', async () => {
        blogsApi.updateBlog.mockRejectedValue(new AxiosError('Network Error'))
        renderForm(published)
        fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Long draft' } })
        await save()

        expect(await screen.findByText('Cannot reach the server.')).toBeInTheDocument()
        expect(screen.getByLabelText('Content')).toHaveValue('Long draft')
    })
})
