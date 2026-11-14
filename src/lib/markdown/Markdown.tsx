import type { AnchorHTMLAttributes } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { env } from '@/lib/env'

const siteHost = new URL(env.siteUrl).host

const isExternal = (href: string | undefined) => {
    if (!href || !/^https?:\/\//i.test(href)) return false
    try {
        return new URL(href).host !== siteHost
    } catch {
        return false
    }
}

const Link = ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (!isExternal(href)) {
        return (
            <a href={href} {...rest}>
                {children}
            </a>
        )
    }
    return (
        <a href={href} {...rest} target="_blank" rel="noopener noreferrer nofollow">
            {children}
        </a>
    )
}

/**
 * Renders untrusted Markdown safely: raw HTML is ignored, output is sanitized,
 * code is highlighted and external links open in a new tab.
 * Has no hooks, so it works in Server Components and in the admin preview.
 */
export const Markdown = ({ content }: { content: string }) => (
    <div className="prose prose-neutral max-w-none break-words prose-pre:overflow-x-auto prose-img:rounded-lg">
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize, rehypeHighlight]}
            components={{ a: Link }}
        >
            {content}
        </ReactMarkdown>
    </div>
)
