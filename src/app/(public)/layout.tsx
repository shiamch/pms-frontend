import { SiteFooter } from '@/components/public/SiteFooter'
import { SiteHeader } from '@/components/public/SiteHeader'

const PublicLayout = ({ children }: LayoutProps<'/'>) => (
    <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <SiteFooter />
    </>
)

export default PublicLayout
