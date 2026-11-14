import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminProviders } from './AdminProviders'
import { LoginForm } from './LoginForm'

const replace = vi.fn()
let searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace, push: vi.fn() }),
    useSearchParams: () => searchParams,
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

const renderForm = () =>
    render(
        <AdminProviders>
            <LoginForm />
        </AdminProviders>,
    )

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        searchParams = new URLSearchParams()
        authApi.self.mockRejectedValue(new Error('401'))
    })

    it('requires email and password', async () => {
        renderForm()
        await userEvent.click(screen.getByRole('button', { name: /log in/i }))
        expect(await screen.findByText('Please enter your email')).toBeInTheDocument()
        expect(screen.getByText('Please enter your password')).toBeInTheDocument()
        expect(authApi.login).not.toHaveBeenCalled()
    })

    it('logs in and goes to the safe returnTo path', async () => {
        searchParams = new URLSearchParams('returnTo=/admin/blogs')
        authApi.login.mockResolvedValue({ id: 1 })
        authApi.self.mockRejectedValueOnce(new Error('401')).mockResolvedValue(owner)
        renderForm()

        await userEvent.type(screen.getByLabelText('Email'), 'o@x.com')
        await userEvent.type(screen.getByLabelText('Password'), 'secret')
        await userEvent.click(screen.getByRole('button', { name: /log in/i }))

        await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin/blogs'))
        expect(authApi.login).toHaveBeenCalledWith({
            email: 'o@x.com',
            password: 'secret',
        })
    })

    it('ignores an unsafe returnTo', async () => {
        searchParams = new URLSearchParams('returnTo=//evil.com')
        authApi.login.mockResolvedValue({ id: 1 })
        authApi.self.mockRejectedValueOnce(new Error('401')).mockResolvedValue(owner)
        renderForm()

        await userEvent.type(screen.getByLabelText('Email'), 'o@x.com')
        await userEvent.type(screen.getByLabelText('Password'), 'secret')
        await userEvent.click(screen.getByRole('button', { name: /log in/i }))

        await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin'))
    })

    it('shows the backend error', async () => {
        const config = { headers: new AxiosHeaders() }
        authApi.login.mockRejectedValue(
            new AxiosError('fail', 'ERR', config, undefined, {
                status: 400,
                data: {
                    errors: [
                        { msg: 'Email or password does not match.', location: 'server' },
                    ],
                },
                statusText: '',
                headers: {},
                config,
            }),
        )
        renderForm()

        await userEvent.type(screen.getByLabelText('Email'), 'o@x.com')
        await userEvent.type(screen.getByLabelText('Password'), 'wrong')
        await userEvent.click(screen.getByRole('button', { name: /log in/i }))

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Email or password does not match.',
        )
    })

    it('redirects away when already logged in', async () => {
        authApi.self.mockResolvedValue(owner)
        renderForm()
        await waitFor(() => expect(replace).toHaveBeenCalledWith('/admin'))
    })
})
