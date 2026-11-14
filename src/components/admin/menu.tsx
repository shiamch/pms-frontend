import { DashboardOutlined, FileTextOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'

export interface AdminMenuItem {
    key: string
    href: string
    label: string
    icon: ReactNode
}

/** Admin navigation. A new backend module adds one entry here. */
export const adminMenu: AdminMenuItem[] = [
    { key: 'dashboard', href: '/admin', label: 'Dashboard', icon: <DashboardOutlined /> },
    { key: 'blogs', href: '/admin/blogs', label: 'Blogs', icon: <FileTextOutlined /> },
]

/** Finds the menu item for a path: the one with the longest matching href. */
export const activeMenuKey = (pathname: string) => {
    const matches = adminMenu.filter(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    matches.sort((a, b) => b.href.length - a.href.length)
    return matches[0]?.key
}
