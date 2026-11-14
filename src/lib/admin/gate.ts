export const AUTH_COOKIES = ['accessToken', 'refreshToken']
export const LOGIN_PATH = '/admin/login'

/**
 * True when an admin page is requested without any auth cookie.
 * This is only a UX shortcut: the backend still checks every admin API call.
 */
export const shouldRedirectToLogin = (pathname: string, cookieNames: string[]) => {
    const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
    if (!isAdmin || pathname === LOGIN_PATH) return false
    return !cookieNames.some((name) => AUTH_COOKIES.includes(name))
}
