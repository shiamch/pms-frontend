# pms-frontend

Frontend for the personal management system (`pms-backend`). It has two parts in one
Next.js app:

- **Public blog** (`/`, `/blog`, `/blog/[slug]`): server-rendered, so posts can be
  found by Google, and every post gets an Open Graph share image.
- **Admin panel** (`/admin`): only the owner can use it. You can write, edit, publish
  and delete posts in Markdown.

Every page is mobile responsive.

## Stack

| Part        | Tools                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------ |
| Framework   | Next.js 16 (App Router, Cache Components), React 19, TypeScript, pnpm                      |
| Public site | Tailwind CSS 4 + typography, react-markdown, remark-gfm, rehype-sanitize, rehype-highlight |
| Admin panel | antd 6, TanStack React Query, zustand, axios, @uiw/react-md-editor                         |
| Tests       | Vitest, Testing Library, jsdom, axios-mock-adapter                                         |

## Run locally

Prerequisites: Node 22+, pnpm 10. `pms-backend` must be running on port 5600, and its
`CORS_ORIGINS` must include `http://localhost:5173` (it does by default).

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:5173 for the blog and http://localhost:5173/admin for the admin
panel.

## Environment variables

| Name                          | Used by                                                 | Example                        |
| ----------------------------- | ------------------------------------------------------- | ------------------------------ |
| `NEXT_PUBLIC_BACKEND_API_URL` | browser (admin)                                         | `http://localhost:5600/api/v1` |
| `BACKEND_API_URL`             | Next server (public pages); falls back to the one above | `http://localhost:5600/api/v1` |
| `NEXT_PUBLIC_SITE_URL`        | canonical, Open Graph and sitemap URLs                  | `http://localhost:5173`        |
| `NEXT_PUBLIC_SITE_NAME`       | titles, header, share images                            | `Shiam Chowdhury`              |

`NEXT_PUBLIC_*` values are baked in at build time, so rebuild after you change them.

## Scripts

| Script                      | What it does                                                                 |
| --------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`                  | Dev server on port 5173                                                      |
| `pnpm build` / `pnpm start` | Production build / server on port 5173. The build does not need the backend. |
| `pnpm test`                 | Unit and component tests                                                     |
| `pnpm lint` / `pnpm format` | ESLint / Prettier                                                            |

## Folder map

```
src/
  app/
    (public)/          public blog pages (Server Components)
    admin/             admin panel; (panel)/ holds the pages behind the sidebar
    opengraph-image.tsx, sitemap.ts, robots.ts
  components/
    public/            header, footer, post cards, pagination
    admin/             shell, login form, blog list, blog editor
  lib/
    env.ts             all environment config
    public-api.ts      cached server-side fetches for the public site
    markdown/          safe Markdown renderer and description helper
    admin/             axios client, auth store, guard helpers, blog API
  proxy.ts             redirects to login when there are no auth cookies
```

## Security model

- **The backend is the real gate.** Every `/api/v1/admin/*` route checks the JWT. The
  frontend never decides who is allowed.
- `src/proxy.ts` only checks whether an auth cookie _exists_, and redirects to login if
  not. This is for UX, not security.
- Tokens stay in the backend's `httpOnly` cookies and never reach JavaScript or
  `localStorage`. When parallel requests get a 401, they share one refresh call, because
  the backend rotates the refresh token.
- Post content is Markdown rendered with raw HTML disabled and `rehype-sanitize`. The
  admin preview uses the same renderer.
- Security headers on every response: CSP, `X-Frame-Options: DENY`, `nosniff`, a strict
  referrer policy and a permissions policy.
- Admin pages send `noindex`, and `robots.txt` disallows `/admin`. Admin code is never
  loaded on public pages.
- Login redirects only go back to `/admin/...` paths, so they can't be used as open
  redirects.

## Caching

Public data is cached with `'use cache'` + `cacheLife('minutes')`. A newly published or
edited post shows up on the site and in the sitemap within about a minute. A failed
backend call is cached for only a few seconds.

## Deployment plan (not done yet)

The plan is GitHub Actions CI/CD to an AWS EC2 instance:

- `shiamchowdhury.com` serves the public blog.
- `admin.shiamchowdhury.com` serves the admin panel.
- The backend runs on a subdomain such as `api.shiamchowdhury.com`, with
  `MAIN_DOMAIN=shiamchowdhury.com` so its cookies are shared across subdomains.

All three are on the same site, so `sameSite: strict` cookies work. The admin routes all
live under `/admin`, so host-based routing can be added to `src/proxy.ts` later: serve
`/admin` on `admin.` and return 404 for `/admin` on the public host. Remember to add the
production frontend origins to the backend's `CORS_ORIGINS` and to set the env variables
above.
