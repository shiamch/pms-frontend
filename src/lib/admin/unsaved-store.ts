import { create } from 'zustand'

interface UnsavedState {
    dirty: boolean
    setDirty: (dirty: boolean) => void
}

/** Tracks whether a form has unsaved changes, so navigation can warn first. */
export const useUnsavedStore = create<UnsavedState>()((set) => ({
    dirty: false,
    setDirty: (dirty) => set({ dirty }),
}))

/** Asks before leaving when there are unsaved changes. Returns true to continue. */
export const confirmLeave = () =>
    !useUnsavedStore.getState().dirty ||
    window.confirm('You have unsaved changes. Leave this page anyway?')
