# pms-frontend — Design

Date: 2026-11-14
Backend: `../pms-backend` (Express 5, single owner account, blog module)
Repo: https://github.com/shiamch/pms-frontend (branch `main`)

## Intent

The frontend of the personal management system. It has two halves in one app:

1. **Public blog**: visitors read published posts. It must be found by Google and
   produce rich link previews (title, description, image) on Facebook / LinkedIn.
2. **Admin panel**: only the owner logs in and writes / edits / deletes / publishes
   posts. Visitors must never be able to use the admin panel or admin APIs.

Mobile responsive everywhere is a hard requirement, for both halves.
More admin features will be added later as the backend grows (modular monolith),
so the admin side must make adding a new section easy.

## Goals

- Server-rendered public pages with correct SEO meta, Open Graph and Twitter cards.
- Owner login, session refresh, logout against the existing backend auth.
- Full blog management: list (search, status filter, pagination), create, edit,
  delete, draft/publish.
- Markdown authoring with live preview; safe Markdown rendering on the public side.
- Works well from 360px phones up to desktop.

## Non-goals (for now)

- Image upload / cover images (backend has no field for it yet).
- Comments, tags/categories, RSS, multi-language, dark mode.
- Any backend changes. If a backend change becomes necessary, stop and ask.

## Anti-goals

- Security that lives only in the frontend. Hiding a page is not protection; the
  backend's `authenticate` on `/api/v1/admin/*` is the real gate.
- Rendering raw, unsanitized HTML from post content.
- A public site that ships the admin bundle (antd, editor) to visitors.
- A layout that only works on desktop.

## Constraints from the backend

- Base URL `/api/v1`. Default port 5600.
- Auth: `POST /auth/login {email,password}`, `GET /auth/self`, `POST /auth/refresh`,
  `POST /auth/logout`. Tokens are `httpOnly` cookies `accessToken` / `refreshToken`,
  `sameSite: 'strict'`, `domain: MAIN_DOMAIN`. Login is rate limited (5 / 15 min).
- `/auth/self` returns `{ id, firstName, lastName, email, createdAt, updatedAt }`.
- Public: `GET /blogs?currentPage&perPage&q`, `GET /blogs/:slug` (published only).
- Admin: `GET/POST /admin/blogs`, `GET/PATCH/DELETE /admin/blogs/:id`.
- Lists return `{ data, total, currentPage, perPage }`; `perPage` max 100.
- Blog: `id, title (≤200), slug (unique, letters/numbers/dashes, auto from title if
  omitted), excerpt (≤500, nullable), content (text), status ('draft'|'published'),
  publishedAt, createdAt, updatedAt`.
- CORS allows only `CORS_ORIGINS` with credentials.

**Deployment consequence:** because cookies are `sameSite: strict` and bound to
`MAIN_DOMAIN`, frontend and backend must sit on the same registrable domain in
production (e.g. `example.com` + `api.example.com`, `MAIN_DOMAIN=example.com`).
On local dev both run on `localhost` (cookies ignore ports), so it just works.

## Approaches considered

| Option | Trade-off |
| --- | --- |
| **A. Next.js App Router, public + admin in one project** (chosen) | SSR/ISR for SEO and previews, one repo, one deploy, middleware can guard `/admin` on the server. Needs a Node host or Vercel; admin-dashboard code can't be copied 1:1 because routing differs. |
| B. Two apps: Next.js/Astro public + Vite SPA admin | Strongest isolation, admin code reuse. Two projects to maintain and deploy for one person. |
| C. Single Vite SPA with prerender tricks | Simplest, but every new post needs a rebuild for SEO/previews. Fragile. Rejected. |

The owner chose **A**. Content format: owner chose **Markdown** (over a rich-text editor),
because it is simplest to secure and natural for a developer blog.

## Decided

- **Framework:** Next.js (latest stable, App Router), TypeScript, pnpm.
- **Two route groups:** `app/(public)/...` and `app/admin/...`, each with its own
  layout, so public pages never import antd or the editor.
- **Admin stack:** antd + @ant-design/icons, TanStack React Query, zustand, axios —
  same as admin-dashboard, so patterns carry over (axios client with 401 → refresh →
  retry once → logout; zustand auth store; React Query for lists and mutations).
- **Markdown:** stored as-is in `content`.

## Builder's calls (proposed defaults, owner may override)

### Routes

Public:
- `/` — home: latest published posts (paginated list).
- `/blog` — all posts, search box (`q`), pagination via `?page=`.
- `/blog/[slug]` — single post. 404 page if not found.
- `sitemap.xml`, `robots.txt` (allow public, disallow `/admin`).

Admin (all `noindex, nofollow`):
- `/admin/login`
- `/admin` — dashboard home (counts of drafts / published).
- `/admin/blogs` — list with search, status filter, pagination.
- `/admin/blogs/new`, `/admin/blogs/[id]/edit`.

### Public rendering
- Server Components fetch the backend's public API directly from the Next server
  using `BACKEND_API_URL` (server-only env), with ISR `revalidate: 60`.
  A post published in admin appears within a minute. (On-demand revalidation is a
  possible later improvement, not needed now.)
- `generateMetadata` per post: `title`, `description` = excerpt or the first ~160
  chars of stripped Markdown, canonical URL, Open Graph `article` and Twitter
  `summary_large_image`.
- **Preview image without a cover field:** a per-post generated OG image via
  `next/og` (`opengraph-image.tsx`) showing site name + post title. Solves the
  "image in share preview" need with no backend change.
- Markdown → HTML on the server: `react-markdown` + `remark-gfm` + `rehype-sanitize`
  (default GitHub schema) + syntax highlighting (`rehype-highlight` or Shiki, builder
  picks). Raw HTML in Markdown is not rendered. Links to external sites get
  `rel="noopener noreferrer nofollow"`.
- Styling: Tailwind CSS + `@tailwindcss/typography` for readable article text.
  Mobile-first. Public site has a simple header (site name, Blog link) and footer.
- `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_SITE_NAME` env vars for canonical/OG URLs.

### Admin auth flow
- Browser calls the backend directly with `withCredentials: true`, base URL from
  `NEXT_PUBLIC_BACKEND_API_URL` (exactly like admin-dashboard).
- `middleware.ts` on `/admin/:path*` (except `/admin/login`): if neither `accessToken`
  nor `refreshToken` cookie is present, redirect to `/admin/login?returnTo=<path>`.
  This is a UX gate only; it does not verify the JWT (frontend never holds the secret).
- Admin layout calls `/auth/self` on load (React Query), shows a full-screen spinner
  until resolved; on failure → login. Same behaviour as admin-dashboard's Root layout.
- Login form: email + password, shows backend validation and rate-limit (429)
  messages, redirects to `returnTo` (only if it starts with `/admin`, to avoid open
  redirect) or `/admin`.
- Logout from the header dropdown → `POST /auth/logout`, clear store, go to login.

### Admin UI
- antd `Layout`: on ≥ `lg` a collapsible `Sider` menu; below `lg` the Sider is
  replaced by a hamburger button opening a `Drawer` with the same menu.
- Menu config is a single array (key, icon, label, href) so new modules add one entry.
- Blogs list: antd `Table` on ≥ `md`; on phones a list of cards (title, status tag,
  date, edit/delete actions). Search input with debounce, status `Select`, pagination
  ("x–y of total").
- Blog form: title, slug (optional, auto-generated by backend if empty), excerpt,
  status, content. Content uses a Markdown editor (`@uiw/react-md-editor`, loaded with
  `next/dynamic` and `ssr: false`). On phones the editor shows Write / Preview tabs
  instead of side-by-side. The preview uses the same sanitized renderer as the
  public page so what you see is what visitors get.
- Delete asks for confirmation (antd `Popconfirm`/`Modal`).
- Backend validation errors (400 with field errors) are mapped onto form fields.
- Slugs: the backend never returns a slug conflict; it silently appends `-2`, `-3`…
  After saving, the form shows the slug the backend actually stored, with a notice
  if it differs from what was typed. (Builder's call, no backend change.)
- Changing the slug of a **published** post breaks its old URL (404, lost SEO,
  dead shares; there is no redirect). The slug field is therefore read-only on
  published posts, with an "Edit slug" toggle that shows a clear warning first.
  (Builder's call.)
- When a post goes back to draft the backend keeps `publishedAt`, so a re-published
  post shows its original date. Accepted as-is. (Builder's call.)
- Unsaved-changes warning when leaving the form.

### Security hardening (frontend side)
- Security headers in `next.config` for all routes: `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` minimal, and a Content-Security-Policy that limits `connect-src`
  to self + backend URL. (CSP strictness tuned so Next and antd still work; builder may
  start with a report-only or nonce-free policy if needed and note it.)
- No tokens in `localStorage`; auth only via the backend's httpOnly cookies.
- Admin pages `noindex`; `robots.txt` disallows `/admin`.
- Admin JS lives only in admin route bundles.

### Project hygiene
- ESLint + Prettier, `.env.example` with all vars, README (setup, env, scripts,
  deploy note about same-domain cookies).
- Tests: Vitest + Testing Library for the login form, the axios refresh interceptor,
  the Markdown renderer's sanitization (script / `javascript:` links stripped), and
  `returnTo` validation. Build (`pnpm build`) must pass with no type errors.
- Code style per owner's global prefs: `const` over `let`, never `var`, arrow
  functions, small functions, early returns, JSDoc on exported functions.

### Local dev
- Next dev server runs on port **5173**, because the backend's `CORS_ORIGINS`
  already allows `http://localhost:5173`. No backend config change. (Builder's call.)
- `pnpm build` must not require a running backend: public pages and the sitemap are
  rendered on first request and then cached by ISR, and fetch failures at build time
  must not break the build.

### Deployment (later, out of scope now)
- Now: local only. Later (separate task): GitHub Actions CI/CD and deploy to an
  AWS EC2 instance.
- Planned domains: public `shiamchowdhury.com`, admin `admin.shiamchowdhury.com`,
  backend on a subdomain such as `api.shiamchowdhury.com` with
  `MAIN_DOMAIN=shiamchowdhury.com`. All are same-site, so `sameSite: strict`
  cookies work.
- Prepare for it now, without building it: keep every URL in env vars, and keep the
  admin routes self-contained under `/admin` so that host-based routing in
  `middleware.ts` can later serve `/admin` on `admin.` and return 404 for `/admin`
  on the public host. The README documents this plan.

### Repo
- `git init`, `README.md`, commit, branch `main`, remote
  `https://github.com/shiamch/pms-frontend.git`, push to `main`.

## Left to the builder

- Exact folder structure inside `src/`, component breakdown, colour palette
  (clean, neutral, readable).
- Highlighting library choice; date formatting library (or `Intl`).
- Pagination page size (suggest 10).
