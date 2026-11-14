import { isAxiosError } from 'axios'

interface BackendError {
    msg?: string
    path?: string
    location?: string
}

const backendErrors = (err: unknown): BackendError[] => {
    if (!isAxiosError(err)) return []
    const errors = (err.response?.data as { errors?: unknown } | undefined)?.errors
    return Array.isArray(errors) ? (errors as BackendError[]) : []
}

/** Turns any API error into one human-readable sentence. */
export const getErrorMessage = (err: unknown) => {
    if (!isAxiosError(err)) return 'Something went wrong.'
    if (!err.response) return 'Cannot reach the server.'
    if (err.response.status === 429) {
        return 'Too many login attempts. Please wait 15 minutes and try again.'
    }
    const first = backendErrors(err).find((e) => e.msg)?.msg
    if (first) return first
    const message = (err.response.data as { message?: unknown } | undefined)?.message
    if (typeof message === 'string' && message) return message
    return 'Something went wrong.'
}

/**
 * Maps backend validation errors (express-validator) to antd `form.setFields` input.
 * Server errors are skipped: their `path` is the request URL, not a field.
 */
export const getFieldErrors = (err: unknown) => {
    const grouped = new Map<string, string[]>()
    for (const error of backendErrors(err)) {
        if (error.location === 'server' || !error.path || !error.msg) continue
        grouped.set(error.path, [...(grouped.get(error.path) ?? []), error.msg])
    }
    return [...grouped].map(([name, errors]) => ({ name, errors }))
}
