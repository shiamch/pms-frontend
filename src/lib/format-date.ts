const formatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })

/** Formats an ISO date string like "Nov 14, 2026". */
export const formatDate = (iso: string) => formatter.format(new Date(iso))
