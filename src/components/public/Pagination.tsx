import Link from 'next/link'

const pageHref = (page: number, q?: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (page > 1) params.set('page', String(page))
    const query = params.toString()
    return query ? `/blog?${query}` : '/blog'
}

const linkClass = 'rounded-lg border border-neutral-300 px-3 py-2 hover:bg-neutral-100'

/** Previous / next links for the blog list. Hidden when there is one page. */
export const Pagination = ({ page, totalPages, q }: { page: number; totalPages: number; q?: string }) => {
    if (totalPages <= 1) return null
    return (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-2 pt-6">
            {page > 1 ? (
                <Link href={pageHref(page - 1, q)} className={linkClass}>
                    ← Newer
                </Link>
            ) : (
                <span />
            )}
            <span className="text-sm text-neutral-500">
                Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
                <Link href={pageHref(page + 1, q)} className={linkClass}>
                    Older →
                </Link>
            ) : (
                <span />
            )}
        </nav>
    )
}
