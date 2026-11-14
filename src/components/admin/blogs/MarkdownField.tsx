'use client'

import '@uiw/react-md-editor/markdown-editor.css'
import { Grid, Segmented } from 'antd'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Markdown } from '@/lib/markdown/Markdown'

const MDEditor = dynamic(() => import('@uiw/react-md-editor/nohighlight'), {
    ssr: false,
    loading: () => (
        <div className="h-[60vh] rounded-lg border border-neutral-200 bg-neutral-50" />
    ),
})

interface MarkdownFieldProps {
    id?: string
    value?: string
    onChange?: (value: string) => void
}

const Preview = ({ value }: { value: string }) => (
    <div className="h-full overflow-auto rounded-lg border border-neutral-200 bg-white p-4">
        {value.trim() ? (
            <Markdown content={value} />
        ) : (
            <p className="text-neutral-400">Nothing to preview yet.</p>
        )}
    </div>
)

/**
 * Markdown input for antd Form. Side-by-side editor and preview on wide screens,
 * Write / Preview tabs on phones. The preview uses the same sanitized renderer
 * as the public site, so it shows exactly what visitors will see.
 */
export const MarkdownField = ({ id, value = '', onChange }: MarkdownFieldProps) => {
    const screens = Grid.useBreakpoint()
    const [tab, setTab] = useState<'write' | 'preview'>('write')
    const editor = (
        <div data-color-mode="light" className="h-full">
            <MDEditor
                value={value}
                onChange={(next) => onChange?.(next ?? '')}
                preview="edit"
                height="100%"
                visibleDragbar={false}
                textareaProps={{ id, placeholder: 'Write your post in Markdown…' }}
            />
        </div>
    )

    if (screens.md) {
        return (
            <div className="grid h-[600px] grid-cols-2 gap-3">
                {editor}
                <Preview value={value} />
            </div>
        )
    }

    return (
        <div>
            <Segmented
                block
                value={tab}
                onChange={setTab}
                options={[
                    { label: 'Write', value: 'write' },
                    { label: 'Preview', value: 'preview' },
                ]}
                className="mb-2"
            />
            <div className="h-[60vh]">
                {tab === 'write' ? editor : <Preview value={value} />}
            </div>
        </div>
    )
}
