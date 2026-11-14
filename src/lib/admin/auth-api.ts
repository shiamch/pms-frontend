import type { User } from '@/types/user'
import { api } from './http'

/** Logs the owner in. The backend sets the auth cookies. */
export const login = (body: { email: string; password: string }) =>
    api.post<{ id: number }>('/auth/login', body).then((res) => res.data)

/** Returns the logged-in owner, or rejects with 401. */
export const self = () => api.get<User>('/auth/self').then((res) => res.data)

/** Logs out and clears the auth cookies. */
export const logout = () => api.post('/auth/logout').then((res) => res.data)
