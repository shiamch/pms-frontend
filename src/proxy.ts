import { NextResponse, type NextRequest } from 'next/server'
import { LOGIN_PATH, shouldRedirectToLogin } from '@/lib/admin/gate'

/**
 * Sends visitors without auth cookies from admin pages to the login page.
 * Optimistic check only; the backend verifies the token on every admin API call.
 */
export const proxy = (request: NextRequest) => {
    const { pathname, search } = request.nextUrl
    const cookieNames = request.cookies.getAll().map((cookie) => cookie.name)
    if (!shouldRedirectToLogin(pathname, cookieNames)) return NextResponse.next()

    const loginUrl = new URL(LOGIN_PATH, request.url)
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
}

export const config = {
    matcher: ['/admin', '/admin/:path*'],
}
