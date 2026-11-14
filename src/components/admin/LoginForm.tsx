'use client'

import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Button, Card, Form, Input, Typography } from 'antd'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { login, self } from '@/lib/admin/auth-api'
import { useAuthStore } from '@/lib/admin/auth-store'
import { getErrorMessage } from '@/lib/admin/errors'
import { safeReturnTo } from '@/lib/admin/return-to'

interface Credentials {
    email: string
    password: string
}

/** Owner login. Sends the owner back to the page they wanted, if it is safe. */
export const LoginForm = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const setUser = useAuthStore((state) => state.setUser)
    const target = safeReturnTo(searchParams.get('returnTo'))

    // Already logged in? Skip the form.
    const existingSession = useQuery({ queryKey: ['self'], queryFn: self, retry: false })
    useEffect(() => {
        if (!existingSession.data) return
        setUser(existingSession.data)
        router.replace(target)
    }, [existingSession.data, setUser, router, target])

    const mutation = useMutation({
        mutationFn: async (values: Credentials) => {
            await login(values)
            return self()
        },
        onSuccess: (user) => {
            setUser(user)
            router.replace(target)
        },
    })

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-8">
            <Card className="w-full max-w-[400px]">
                <Typography.Title level={3} style={{ marginTop: 0 }}>
                    Sign in
                </Typography.Title>
                <Typography.Paragraph type="secondary">Owner access only.</Typography.Paragraph>
                {mutation.isError && (
                    <Alert
                        type="error"
                        role="alert"
                        showIcon
                        title={getErrorMessage(mutation.error)}
                        style={{ marginBottom: 16 }}
                    />
                )}
                <Form<Credentials>
                    layout="vertical"
                    requiredMark={false}
                    onFinish={(values) => mutation.mutate(values)}
                    disabled={mutation.isPending}
                >
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} type="email" autoComplete="username" size="large" />
                    </Form.Item>
                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: 'Please enter your password' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} autoComplete="current-password" size="large" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={mutation.isPending}>
                        Log in
                    </Button>
                </Form>
            </Card>
        </div>
    )
}
