'use client'

import { LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Avatar,
    Button,
    Drawer,
    Dropdown,
    Grid,
    Layout,
    Menu,
    Modal,
    Result,
    Spin,
    theme,
} from 'antd'
import { isAxiosError } from 'axios'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { logout, self } from '@/lib/admin/auth-api'
import { useAuthStore } from '@/lib/admin/auth-store'
import { getErrorMessage } from '@/lib/admin/errors'
import type { User } from '@/types/user'
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

const isUnauthorized = (err: unknown) => isAxiosError(err) && err.response?.status === 401

const loginHref = (pathname: string) =>
    `/admin/login?returnTo=${encodeURIComponent(pathname)}`

const SelfError = ({ error, onRetry }: { error: unknown; onRetry: () => void }) => (
    <Result
        status="warning"
        title="Couldn't reach the server"
        subTitle={getErrorMessage(error)}
        extra={
            <Button type="primary" onClick={onRetry}>
                Retry
            </Button>
        }
    />
)

/**
 * Admin chrome: loads the owner, then shows the sidebar (desktop) or drawer (mobile).
 * If the session expires later, the page stays mounted (so unsaved work survives)
 * and a modal asks the owner to log in again in a new tab.
 */
export const AdminShell = ({ children }: { children: ReactNode }) => {
    const pathname = usePathname()
    const router = useRouter()
    const screens = Grid.useBreakpoint()
    const isDesktop = Boolean(screens.lg)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [collapsed, setCollapsed] = useState(false)
    const [sessionExpired, setSessionExpired] = useState(false)
    const { user, setUser, logout: clearUser } = useAuthStore()
    const [lastOwner, setLastOwner] = useState<User | null>(null)
    const loggingOut = useRef(false)
    const queryClient = useQueryClient()
    const { token } = theme.useToken()

    const selfQuery = useQuery({ queryKey: ['self'], queryFn: self, retry: false })
    const owner = user ?? (sessionExpired ? lastOwner : selfQuery.data)

    useEffect(() => {
        if (selfQuery.data) setUser(selfQuery.data)
    }, [selfQuery.data, setUser])

    // Logged out from the start: go to login, then come back here.
    useEffect(() => {
        if (selfQuery.isError && isUnauthorized(selfQuery.error))
            router.replace(loginHref(pathname))
    }, [selfQuery.isError, selfQuery.error, router, pathname])

    // A failed token refresh clears the user while a page is open.
    useEffect(
        () =>
            useAuthStore.subscribe((state, previous) => {
                if (state.user) {
                    setLastOwner(state.user)
                    setSessionExpired(false)
                    return
                }
                if (previous.user && !loggingOut.current) setSessionExpired(true)
            }),
        [],
    )

    const logoutMutation = useMutation({
        mutationFn: logout,
        onSettled: () => {
            loggingOut.current = true
            clearUser()
            queryClient.clear()
            router.replace('/admin/login')
        },
    })

    if (!owner) {
        if (selfQuery.isError && !isUnauthorized(selfQuery.error)) {
            return (
                <SelfError error={selfQuery.error} onRetry={() => selfQuery.refetch()} />
            )
        }
        return <FullScreenSpinner />
    }

    const userMenu = {
        items: [
            {
                key: 'name',
                label: `${owner.firstName} ${owner.lastName}`,
                disabled: true,
            },
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
                            <span className="hidden sm:inline">{owner.firstName}</span>
                        </Button>
                    </Dropdown>
                </Header>
                <Content style={{ padding: isDesktop ? 24 : 16 }}>{children}</Content>
            </Layout>
            <Modal
                open={sessionExpired}
                title="Your session has expired"
                closable={false}
                maskClosable={false}
                keyboard={false}
                footer={[
                    <Button
                        key="login"
                        onClick={() =>
                            window.open(loginHref(pathname), '_blank', 'noopener')
                        }
                    >
                        Log in in a new tab
                    </Button>,
                    <Button
                        key="continue"
                        type="primary"
                        loading={selfQuery.isFetching}
                        onClick={() => selfQuery.refetch()}
                    >
                        I&apos;ve logged in, continue
                    </Button>,
                ]}
            >
                Log in again in a new tab, then come back and continue. Your unsaved work
                on this page is kept.
            </Modal>
        </Layout>
    )
}
