'use client'

import { LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Drawer, Dropdown, Grid, Layout, Menu, Spin, theme } from 'antd'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import { logout, self } from '@/lib/admin/auth-api'
import { useAuthStore } from '@/lib/admin/auth-store'
import { confirmLeave, useUnsavedStore } from '@/lib/admin/unsaved-store'
import { activeMenuKey, adminMenu } from './menu'

const { Header, Sider, Content } = Layout

const Brand = () => (
    <Link
        href="/admin"
        className="block truncate px-4 py-4 text-lg font-semibold text-neutral-900"
    >
        PMS Admin
    </Link>
)

const NavMenu = ({ onNavigate }: { onNavigate?: () => void }) => {
    const pathname = usePathname()
    const router = useRouter()
    const selected = activeMenuKey(pathname)
    return (
        <Menu
            mode="inline"
            selectedKeys={selected ? [selected] : []}
            style={{ borderInlineEnd: 'none' }}
            items={adminMenu.map((item) => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
                onClick: () => {
                    if (!confirmLeave()) return
                    useUnsavedStore.getState().setDirty(false)
                    onNavigate?.()
                    router.push(item.href)
                },
            }))}
        />
    )
}

const FullScreenSpinner = () => (
    <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
    </div>
)

/** Admin chrome: loads the owner, then shows the sidebar (desktop) or drawer (mobile). */
export const AdminShell = ({ children }: { children: ReactNode }) => {
    const pathname = usePathname()
    const router = useRouter()
    const screens = Grid.useBreakpoint()
    const isDesktop = Boolean(screens.lg)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const { user, setUser, logout: clearUser } = useAuthStore()
    const queryClient = useQueryClient()
    const { token } = theme.useToken()

    const selfQuery = useQuery({ queryKey: ['self'], queryFn: self, retry: false })

    useEffect(() => {
        if (selfQuery.data) setUser(selfQuery.data)
    }, [selfQuery.data, setUser])

    useEffect(() => {
        if (!selfQuery.isError) return
        clearUser()
        router.replace(`/admin/login?returnTo=${encodeURIComponent(pathname)}`)
    }, [selfQuery.isError, clearUser, router, pathname])

    // A failed token refresh anywhere clears the user: send them to login.
    useEffect(() => {
        if (selfQuery.isSuccess && user === null) router.replace('/admin/login')
    }, [selfQuery.isSuccess, user, router])

    const logoutMutation = useMutation({
        mutationFn: logout,
        onSettled: () => {
            clearUser()
            queryClient.clear()
            router.replace('/admin/login')
        },
    })

    if (!user) return <FullScreenSpinner />

    const userMenu = {
        items: [
            { key: 'name', label: `${user.firstName} ${user.lastName}`, disabled: true },
            { type: 'divider' as const },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Logout',
                onClick: () => confirmLeave() && logoutMutation.mutate(),
            },
        ],
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {isDesktop && (
                <Sider
                    theme="light"
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    style={{ borderInlineEnd: `1px solid ${token.colorBorderSecondary}` }}
                >
                    {!collapsed && <Brand />}
                    <NavMenu />
                </Sider>
            )}
            <Drawer
                placement="left"
                open={!isDesktop && drawerOpen}
                onClose={() => setDrawerOpen(false)}
                size={260}
                styles={{ body: { padding: 0 } }}
                title="PMS Admin"
            >
                <NavMenu onNavigate={() => setDrawerOpen(false)} />
            </Drawer>
            <Layout>
                <Header
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        paddingInline: isDesktop ? 24 : 16,
                        background: token.colorBgContainer,
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    }}
                >
                    {isDesktop ? (
                        <span />
                    ) : (
                        <Button
                            type="text"
                            icon={<MenuOutlined />}
                            aria-label="Open menu"
                            onClick={() => setDrawerOpen(true)}
                        />
                    )}
                    <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
                        <Button
                            type="text"
                            aria-label="Account menu"
                            className="flex items-center gap-2"
                        >
                            <Avatar size="small" icon={<UserOutlined />} />
                            <span className="hidden sm:inline">{user.firstName}</span>
                        </Button>
                    </Dropdown>
                </Header>
                <Content style={{ padding: isDesktop ? 24 : 16 }}>{children}</Content>
            </Layout>
        </Layout>
    )
}
