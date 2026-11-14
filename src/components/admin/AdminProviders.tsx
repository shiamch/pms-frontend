'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App, ConfigProvider } from 'antd'
import { useState, type ReactNode } from 'react'

const theme = {
    token: { colorPrimary: '#171717', borderRadius: 8 },
}

/** antd styles, theme and React Query for every admin page. */
export const AdminProviders = ({ children }: { children: ReactNode }) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
            }),
    )
    return (
        <AntdRegistry>
            <ConfigProvider theme={theme}>
                <App>
                    <QueryClientProvider client={queryClient}>
                        {children}
                    </QueryClientProvider>
                </App>
            </ConfigProvider>
        </AntdRegistry>
    )
}
