import { env } from '@/lib/env'

/** Bottom bar of the public site. */
export const SiteFooter = () => (
    <footer className="mt-auto border-t border-neutral-200">
        <p className="mx-auto max-w-3xl px-4 py-6 text-sm text-neutral-500">© {env.siteName}</p>
    </footer>
)
