import { useEffect } from 'react'
import { useUnsavedStore } from './unsaved-store'

/** Warns before closing or reloading the tab while `dirty`, and shares the flag with the menu. */
export const useUnsavedChanges = (dirty: boolean) => {
    const setDirty = useUnsavedStore((state) => state.setDirty)

    useEffect(() => {
        setDirty(dirty)
    }, [dirty, setDirty])

    useEffect(() => () => setDirty(false), [setDirty])

    useEffect(() => {
        if (!dirty) return
        const warn = (event: BeforeUnloadEvent) => {
            event.preventDefault()
        }
        window.addEventListener('beforeunload', warn)
        return () => window.removeEventListener('beforeunload', warn)
    }, [dirty])
}
