import { act, render, screen, waitFor } from '@testing-library/react'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/lib/admin/auth-store'
import { AdminProviders } from './AdminProviders'
import { AdminShell } from './AdminShell'

const replace = vi.fn()
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace }),
    usePathname: () => '/admin/blogs/5/edit',
}))

const authApi = vi.hoisted(() => ({ login: vi.fn(), self: vi.fn(), logout: vi.fn() }))
vi.mock('@/lib/admin/auth-api', () => authApi)

const owner = {
    id: 1,
    firstName: 'Shiam',
    lastName: 'C',
    email: 'o@x.com',
    createdAt: '',
    updatedAt: '',
}

const httpError = (status: number) => {
    const config = { headers: new AxiosHeaders() }
    return new AxiosError('fail', 'ERR', config, undefined, {
        status,
        data: {},
        statusText: '',
        headers: {},
        config,
    })
}

const renderShell = () =>
    render(
        <AdminProviders>
            <AdminShell>
                <textarea aria-label="Draft" defaultValue="my long post" />
            </AdminShell>
        </AdminProviders>,
    )

describe('AdminShell', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useAuthStore.setState({ user: null })
    })

    it('stays on the page after a fresh load with a valid session', async () => {
        authApi.self.mockResolvedValue(owner)
        renderShell()
        expect(await screen.findByLabelText('Draft')).toBeInTheDocument()
        await new Promise((resolve) => setTimeout(resolve, 50))
        expect(replace).not.toHaveBeenCalled()
    })

    it('sends a logged-out visitor to login and keeps the page to return to', async () => {
        authApi.self.mockRejectedValue(httpError(401))
        renderShell()
        await waitFor(() =>
            expect(replace).toHaveBeenCalledWith(
                '/admin/login?returnTo=%2Fadmin%2Fblogs%2F5%2Fedit',
            ),
        )
    })

    it('shows a retry instead of logging out when the server fails', async () => {
        authApi.self.mockRejectedValue(httpError(500))
        renderShell()
        expect(await screen.findByRole('button', { name: /retry/i })).toBeInTheDocument()
        expect(replace).not.toHaveBeenCalled()
    })

    it('keeps the page and its content when the session expires', async () => {
        authApi.self.mockResolvedValue(owner)
        renderShell()
        await screen.findByLabelText('Draft')

        act(() => useAuthStore.getState().logout())

        expect(await screen.findByText('Your session has expired')).toBeInTheDocument()
        expect(screen.getByLabelText('Draft')).toHaveValue('my long post')
        expect(replace).not.toHaveBeenCalled()
    })
})
