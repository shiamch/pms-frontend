import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminProviders } from '../AdminProviders'
import { BlogsList } from './BlogsList'

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => '/admin/blogs',
}))

const blogsApi = vi.hoisted(() => ({
    listBlogs: vi.fn(),
    deleteBlog: vi.fn(),
    getBlog: vi.fn(),
    createBlog: vi.fn(),
    updateBlog: vi.fn(),
}))
vi.mock('@/lib/admin/blogs-api', () => blogsApi)

const post = (id: number, title: string, status: 'draft' | 'published') => ({
    id,
    title,
    slug: `post-${id}`,
    excerpt: null,
    content: 'x',
    status,
    publishedAt: status === 'published' ? '2026-11-01T00:00:00Z' : null,
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-02T00:00:00Z',
})

const page = (data: unknown[], total = data.length) => ({
    data,
    total,
    currentPage: 1,
    perPage: 10,
})

const renderList = () =>
    render(
        <AdminProviders>
            <BlogsList />
        </AdminProviders>,
    )

describe('BlogsList', () => {
    beforeEach(() => {
        blogsApi.listBlogs.mockResolvedValue(
            page([post(1, 'First post', 'draft'), post(2, 'Second post', 'published')]),
        )
    })

    afterEach(() => {
        vi.clearAllMocks()
        vi.useRealTimers()
    })

    it('shows titles and status tags', async () => {
        renderList()
        expect((await screen.findAllByText('First post')).length).toBeGreaterThan(0)
        expect(screen.getAllByText('Draft').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Published').length).toBeGreaterThan(0)
    })

    it('searches after a debounce and resets to page 1', async () => {
        renderList()
        await screen.findAllByText('First post')
        vi.useFakeTimers()
        fireEvent.change(screen.getByPlaceholderText('Search by title'), {
            target: { value: 'react' },
        })
        await act(async () => {
            vi.advanceTimersByTime(400)
        })
        vi.useRealTimers()
        await waitFor(() =>
            expect(blogsApi.listBlogs).toHaveBeenLastCalledWith(
                expect.objectContaining({ q: 'react', currentPage: 1 }),
            ),
        )
    })

    it('filters by status', async () => {
        renderList()
        await screen.findAllByText('First post')
        fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Status' }))
        fireEvent.click(await screen.findByTitle('Published'))
        await waitFor(() =>
            expect(blogsApi.listBlogs).toHaveBeenLastCalledWith(
                expect.objectContaining({ status: 'published', currentPage: 1 }),
            ),
        )
    })

    it('shows an empty state with a new post button', async () => {
        blogsApi.listBlogs.mockResolvedValue(page([]))
        renderList()
        expect(await screen.findByText('No posts yet')).toBeInTheDocument()
        expect(screen.getAllByRole('link', { name: /new post/i }).length).toBeGreaterThan(
            0,
        )
    })
})
