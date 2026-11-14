import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/admin/LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

const LoginPage = () => (
    <Suspense fallback={null}>
        <LoginForm />
    </Suspense>
)

export default LoginPage
