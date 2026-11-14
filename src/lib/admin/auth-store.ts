import { create } from 'zustand'
import type { User } from '@/types/user'

interface AuthState {
    user: User | null
    setUser: (user: User) => void
    logout: () => void
}

/** Holds the logged-in owner. `null` means logged out. */
export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    logout: () => set({ user: null }),
}))
