const FALLBACK = '/admin'

/**
 * Returns `value` if it is a safe in-app admin path to go back to after login,
 * otherwise `/admin`. Blocks open redirects such as `//evil.com` or `https://…`.
 */
export const safeReturnTo = (value: string | null | undefined) => {
    if (!value) return FALLBACK
    if (value !== '/admin' && !value.startsWith('/admin/') && !value.startsWith('/admin?')) {
        return FALLBACK
    }
    if (value.startsWith('//') || /[\\:]|\.\./.test(value)) return FALLBACK
    if (value === '/admin/login' || value.startsWith('/admin/login?')) return FALLBACK
    return value
}
