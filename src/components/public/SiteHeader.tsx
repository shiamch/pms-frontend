import Link from 'next/link'
import { env } from '@/lib/env'

/** Top bar of the public site. */
export const SiteHeader = () => (
    <header className="border-b border-neutral-200">
        <nav className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="truncate text-lg font-semibold tracking-tight">
                {env.siteName}
            </Link>
            <Link
                href="/blog"
                className="shrink-0 text-neutral-600 hover:text-neutral-900"
            >
                Blog
            </Link>
        </nav>
    </header>
)
