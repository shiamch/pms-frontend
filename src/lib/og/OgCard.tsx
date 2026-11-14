import { env } from '@/lib/env'

export const ogSize = { width: 1200, height: 630 }

const fontSizeFor = (title: string) => {
    if (title.length > 90) return 52
    if (title.length > 50) return 64
    return 76
}

/** The 1200×630 share card: site name on top, a large title below. */
export const OgCard = ({ title }: { title?: string }) => {
    const heading = title || env.siteName
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 72,
                background: 'linear-gradient(135deg, #0a0a0a 0%, #262626 100%)',
                color: '#fafafa',
            }}
        >
            <div style={{ display: 'flex', fontSize: 32, color: '#a3a3a3' }}>
                {env.siteName}
            </div>
            <div
                style={{
                    display: 'flex',
                    fontSize: fontSizeFor(heading),
                    fontWeight: 700,
                    lineHeight: 1.15,
                    letterSpacing: -1,
                }}
            >
                {heading.length > 140 ? `${heading.slice(0, 137)}…` : heading}
            </div>
            <div
                style={{ display: 'flex', width: 120, height: 8, background: '#fafafa' }}
            />
        </div>
    )
}
