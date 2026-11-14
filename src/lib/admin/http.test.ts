import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from './auth-store'
import { api } from './http'

describe('api client', () => {
    let apiMock: MockAdapter
    let rawMock: MockAdapter

    beforeEach(() => {
        apiMock = new MockAdapter(api)
        rawMock = new MockAdapter(axios)
        useAuthStore.setState({ user: { id: 1 } as never })
    })

    afterEach(() => {
        apiMock.restore()
        rawMock.restore()
        vi.restoreAllMocks()
    })

    it('refreshes once and retries after a 401', async () => {
        apiMock
            .onGet('/admin/blogs')
            .replyOnce(401)
            .onGet('/admin/blogs')
            .replyOnce(200, { ok: 1 })
        rawMock.onPost(/\/auth\/refresh$/).reply(200)

        const res = await api.get('/admin/blogs')

        expect(res.data).toEqual({ ok: 1 })
        expect(rawMock.history.post).toHaveLength(1)
    })

    it('shares one refresh between parallel 401s', async () => {
        apiMock.onGet('/a').replyOnce(401).onGet('/a').replyOnce(200, 'a')
        apiMock.onGet('/b').replyOnce(401).onGet('/b').replyOnce(200, 'b')
        rawMock
            .onPost(/\/auth\/refresh$/)
            .reply(() => new Promise((resolve) => setTimeout(() => resolve([200]), 20)))

        const [a, b] = await Promise.all([api.get('/a'), api.get('/b')])

        expect([a.data, b.data]).toEqual(['a', 'b'])
        expect(rawMock.history.post).toHaveLength(1)
    })

    it('logs out when the refresh fails', async () => {
        apiMock.onGet('/a').reply(401)
        rawMock.onPost(/\/auth\/refresh$/).reply(401)

        await expect(api.get('/a')).rejects.toBeTruthy()
        expect(useAuthStore.getState().user).toBeNull()
    })

    it('does not try to refresh after a failed login', async () => {
        apiMock.onPost('/auth/login').reply(401, { errors: [{ msg: 'Invalid' }] })

        await expect(api.post('/auth/login', {})).rejects.toBeTruthy()
        expect(rawMock.history.post).toHaveLength(0)
    })

    it('refreshes and retries logout when the access token has expired', async () => {
        apiMock
            .onPost('/auth/logout')
            .replyOnce(401)
            .onPost('/auth/logout')
            .replyOnce(200, { ok: 1 })
        rawMock.onPost(/\/auth\/refresh$/).reply(200)

        const res = await api.post('/auth/logout')

        expect(res.data).toEqual({ ok: 1 })
        expect(rawMock.history.post).toHaveLength(1)
    })
})
