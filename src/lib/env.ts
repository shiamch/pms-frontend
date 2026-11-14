const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '')

// NEXT_PUBLIC_* values must be read with literal `process.env.X` so Next can inline them.
const publicBackendApiUrl = stripTrailingSlash(
    process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5600/api/v1',
)

/**
 * App configuration read from environment variables.
 * `backendApiUrl` is for server-side fetches; the browser uses `publicBackendApiUrl`.
 */
export const env = {
    publicBackendApiUrl,
    backendApiUrl: stripTrailingSlash(process.env.BACKEND_API_URL || publicBackendApiUrl),
    siteUrl: stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173'),
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Shiam Chowdhury',
}
