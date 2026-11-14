import type { Metadata } from 'next'
import { connection } from 'next/server'
import { Suspense, type ReactNode } from 'react'
import { AdminProviders } from '@/components/admin/AdminProviders'

export const metadata: Metadata = {
    title: { default: 'Admin', template: '%s | Admin' },
    robots: { index: false, follow: false },
}

// The admin panel is private and per-user, so it is never prerendered.
// antd also uses random ids that Cache Components rejects at build time.
const RequestTime = async ({ children }: { children: ReactNode }) => {
    await connection()
    return <AdminProviders>{children}</AdminProviders>
}

const AdminLayout = ({ children }: LayoutProps<'/admin'>) => (
    <Suspense fallback={null}>
        <RequestTime>{children}</RequestTime>
    </Suspense>
)

export default AdminLayout
