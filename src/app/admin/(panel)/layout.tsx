import { AdminShell } from '@/components/admin/AdminShell'

const PanelLayout = ({ children }: { children: React.ReactNode }) => (
    <AdminShell>{children}</AdminShell>
)

export default PanelLayout
