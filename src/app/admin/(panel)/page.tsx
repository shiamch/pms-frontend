import type { Metadata } from 'next'
import { DashboardStats } from '@/components/admin/DashboardStats'

export const metadata: Metadata = { title: 'Dashboard' }

const DashboardPage = () => (
    <>
        <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
        <DashboardStats />
    </>
)

export default DashboardPage
