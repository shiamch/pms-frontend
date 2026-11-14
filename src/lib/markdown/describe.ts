const stripMarkdown = (markdown: string) =>
    markdown
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]*)`/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
        .replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, '$2')
        .replace(/\|/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

const truncate = (text: string, max: number) => {
    if (text.length <= max) return text
    const cut = text.slice(0, max)
    const lastSpace = cut.lastIndexOf(' ')
    return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/**
 * Builds a short plain-text description for SEO and previews.
 * Uses the excerpt when present, otherwise the start of the Markdown body.
 */
export const toDescription = (markdown: string, excerpt: string | null, max = 160) => {
    const trimmedExcerpt = excerpt?.trim()
    if (trimmedExcerpt) return truncate(trimmedExcerpt, max)
    return truncate(stripMarkdown(markdown), max)
}
