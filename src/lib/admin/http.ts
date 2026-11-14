import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { env } from '@/lib/env'
import { useAuthStore } from './auth-store'

type RetryableConfig = InternalAxiosRequestConfig & { _isRetry?: boolean }

// Logout is not listed: with an expired access token it must refresh and retry,
// or the refresh cookie would survive and the owner would stay logged in.
const NO_REFRESH_URLS = ['/auth/login', '/auth/refresh']

/** Axios instance for the backend API. Sends the auth cookies with every request. */
export const api = axios.create({
    baseURL: env.publicBackendApiUrl,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

// The backend rotates the refresh token on every refresh, so parallel 401s must
// share one refresh call. A second call would use the old token and fail.
let refreshPromise: Promise<void> | null = null

const refreshSession = () => {
    if (!refreshPromise) {
        refreshPromise = axios
            .post(
                `${env.publicBackendApiUrl}/auth/refresh`,
                {},
                { withCredentials: true },
            )
            .then(() => undefined)
            .finally(() => {
                refreshPromise = null
            })
    }
    return refreshPromise
}

const shouldRefresh = (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined
    if (!config || config._isRetry || error.response?.status !== 401) return false
    return !NO_REFRESH_URLS.some((url) => config.url?.endsWith(url))
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        if (!shouldRefresh(error)) return Promise.reject(error)

        const config = error.config as RetryableConfig
        config._isRetry = true
        try {
            await refreshSession()
        } catch (refreshError) {
            useAuthStore.getState().logout()
            return Promise.reject(refreshError)
        }
        return api.request(config)
    },
)
