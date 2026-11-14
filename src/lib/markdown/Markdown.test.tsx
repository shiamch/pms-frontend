import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Markdown } from './Markdown'

const renderMd = (content: string) => render(<Markdown content={content} />).container

describe('Markdown', () => {
    it('renders headings', () => {
        expect(renderMd('# Hi').querySelector('h1')).toHaveTextContent('Hi')
    })

    it('does not render script tags', () => {
        const c = renderMd('<script>alert(1)</script>ok')
        expect(c.querySelector('script')).toBeNull()
    })

    it('does not render raw img with onerror', () => {
        const c = renderMd('<img src=x onerror=alert(1)>')
        expect(c.querySelector('img[onerror]')).toBeNull()
    })

    it('strips javascript: links', () => {
        const a = renderMd('[x](javascript:alert(1))').querySelector('a')
        expect(a?.getAttribute('href') ?? '').not.toMatch(/^javascript:/i)
    })

    it('opens external links safely in a new tab', () => {
        const a = renderMd('[ext](https://example.com)').querySelector('a')!
        expect(a).toHaveAttribute('target', '_blank')
        const rel = a.getAttribute('rel') ?? ''
        expect(rel).toContain('noopener')
        expect(rel).toContain('noreferrer')
        expect(rel).toContain('nofollow')
    })

    it('keeps internal links in the same tab', () => {
        const a = renderMd('[int](/blog/a)').querySelector('a')!
        expect(a).not.toHaveAttribute('target')
    })

    it('renders GFM tables', () => {
        expect(renderMd('|a|b|\n|-|-|\n|1|2|').querySelector('table')).not.toBeNull()
    })

    it('highlights fenced code', () => {
        const code = renderMd('```ts\nconst a = 1\n```').querySelector('code')!
        expect(code.className).toContain('hljs')
    })
})
