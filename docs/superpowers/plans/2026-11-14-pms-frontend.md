# pms-frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js app with a server-rendered public blog and an owner-only admin panel for `pms-backend`, mobile responsive, running locally.

**Architecture:** Next.js App Router. Public pages under the `(public)` route group are Server Components that fetch the backend's public API on the server with ISR. The admin lives under `app/admin`. It is a client-side antd app that calls the backend directly from the browser with cookies (axios + React Query + zustand), guarded by a cookie-presence check in the Next proxy/middleware and by `/auth/self`.

**Tech Stack:** Next.js (latest stable), React 19, TypeScript, pnpm, Tailwind CSS + @tailwindcss/typography (public), antd + @ant-design/icons + @ant-design/nextjs-registry (admin), @tanstack/react-query, zustand, axios, react-markdown + remark-gfm + rehype-sanitize + rehype-highlight, @uiw/react-md-editor, Vitest + Testing Library + jsdom, Prettier.

**Spec:** `docs/superpowers/specs/2026-11-14-pms-frontend-design.md`

## Global Constraints

- Project root: `/Users/shiamchowdhury/Documents/codersgyan/projects/pms-frontend`, `src/` dir, import alias `@/*`.
- Dev server on port **5173** (`next dev -p 5173`); backend at `http://localhost:5600/api/v1`.
- Env vars: `NEXT_PUBLIC_BACKEND_API_URL` (browser), `BACKEND_API_URL` (server only), `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SITE_NAME`. All listed in `.env.example`.
- No backend changes. Never store tokens in `localStorage`/JS; auth only via backend httpOnly cookies, `withCredentials: true`.
- Public pages must not import antd, the md editor, axios, zustand or React Query.
- Markdown: raw HTML never rendered; sanitized with `rehype-sanitize` (default schema); external links get `rel="noopener noreferrer nofollow"` and `target="_blank"`.
- All admin pages: `robots: { index: false, follow: false }`. `robots.txt` disallows `/admin`.
- Backend shapes: list `{ data, total, currentPage, perPage }`; Blog `{ id, title, slug, excerpt: string|null, content, status: 'draft'|'published', publishedAt: string|null, createdAt, updatedAt }`; self `{ id, firstName, lastName, email, createdAt, updatedAt }`. Query params `currentPage`, `perPage` (max 100), `q`, `status`. Page size 10.
- Mobile: no horizontal page scroll at 360px width on any page.
- Code style: `const` over `let`, never `var`, arrow functions, small functions, early returns, JSDoc on every exported function.
- Next ≥16: the request interceptor file is `src/proxy.ts` (export `proxy`); on Next 15 it is `src/middleware.ts` (export `middleware`). Use whichever the installed version expects. This plan says "proxy".
- `pnpm build` must succeed with the backend **not running**.
- Commit after each task; messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Parallel 401s with rotating refresh tokens.** The backend rotates the refresh token on every refresh. If two requests 401 together and each calls `/auth/refresh`, the second refresh fails and logs the owner out. Expected: one in-flight refresh shared by all waiting requests. Tested in Task 5.
2. **Access token expires while writing a post.** Saving after 15+ minutes must refresh and retry silently, and the form content must survive. A failed refresh must not wipe the form without warning. Tested in Task 5 (retry) and Task 8 (form keeps values on save error).
3. **Backend down or slow.** Public pages show a friendly "couldn't load posts" state instead of a crash, and the build still passes. Tested in Task 3.
4. **Open redirect via `returnTo`.** `//evil.com`, `https://evil.com`, `/admin/../x` and `javascript:` must fall back to `/admin`. Tested in Task 5.
5. **Hostile or awkward Markdown on a phone.** `<script>`, `javascript:` links and `onerror` attributes are stripped. Long code lines and unbroken URLs scroll inside their block (or wrap), not the page. Images from `https:` hosts load, so the CSP `img-src` allows `https:`. Tested in Task 2 (sanitize) and checked at 360px in Tasks 3 and 8.

---

### Task 1: Scaffold the project

**Files:**

- Create: whole Next.js skeleton via `create-next-app`; `vitest.config.mts`, `src/test/setup.ts`, `.prettierrc`, `.env.example`, `.env.local` (gitignored), `src/lib/env.ts`, `src/lib/env.test.ts`
- Modify: `package.json` scripts, `next.config.ts`, `README.md` (keep the `# pms-frontend` title)

**Interfaces:**

- Produces: `env` object from `src/lib/env.ts` with `backendApiUrl` (server, falls back to the public one), `publicBackendApiUrl`, `siteUrl` (no trailing slash), `siteName`.

- [ ] **Step 1:** Run `pnpm dlx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-turbopack` inside the existing folder (it already contains `README.md` and `docs/`; move them aside temporarily if the CLI refuses, then restore). Then `pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths prettier`.
- [ ] **Step 2:** Scripts: `dev: next dev -p 5173`, `start: next start -p 5173`, `test: vitest run`, `test:watch: vitest`, `format: prettier . --write`. Vitest config: jsdom, `setupFiles: ['./src/test/setup.ts']` (imports `@testing-library/jest-dom/vitest`), tsconfig paths plugin.
- [ ] **Step 3: Failing test** `src/lib/env.test.ts`: with `NEXT_PUBLIC_SITE_URL='http://localhost:5173/'`, `env.siteUrl === 'http://localhost:5173'`. With `BACKEND_API_URL` unset and `NEXT_PUBLIC_BACKEND_API_URL='http://x/api/v1'`, `env.backendApiUrl === 'http://x/api/v1'`. Use `vi.stubEnv` + `vi.resetModules` + dynamic import.
- [ ] **Step 4:** Run `pnpm test` → FAIL (module missing). Implement `src/lib/env.ts`. Run → PASS.
- [ ] **Step 5:** `.env.example` and `.env.local` with:
      `NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5600/api/v1`, `BACKEND_API_URL=http://localhost:5600/api/v1`, `NEXT_PUBLIC_SITE_URL=http://localhost:5173`, `NEXT_PUBLIC_SITE_NAME=Shiam Chowdhury`.
- [ ] **Step 6:** In `next.config.ts`, `headers()` for `/:path*`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and CSP `default-src 'self'; script-src 'self' 'unsafe-inline'` (plus `'unsafe-eval'` only when `NODE_ENV==='development'`)`; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' <origin of NEXT_PUBLIC_BACKEND_API_URL>; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. Set `poweredByHeader: false`.
- [ ] **Step 7:** Run `pnpm lint && pnpm test && pnpm build` → all pass. Run `pnpm dev`, then `curl -sI localhost:5173 | grep -i content-security` → header present.
- [ ] **Step 8: Commit** `chore: scaffold Next.js app with tests, env and security headers`.

### Task 2: Shared types and the safe Markdown renderer

**Files:**

- Create: `src/types/blog.ts`, `src/types/user.ts`, `src/lib/markdown/Markdown.tsx`, `src/lib/markdown/describe.ts`, tests `src/lib/markdown/Markdown.test.tsx`, `src/lib/markdown/describe.test.ts`
- Modify: `src/app/globals.css` (highlight.js theme import, `@plugin "@tailwindcss/typography"`)

**Interfaces:**

- Produces: `type BlogStatus = 'draft' | 'published'`, `interface Blog`, `interface Paginated<T> { data: T[]; total: number; currentPage: number; perPage: number }`, `interface User` (shapes from Global Constraints).
- Produces: `Markdown({ content }: { content: string }): JSX.Element`. No hooks, so it works in both Server Components and the admin preview. Wraps output in `<div className="prose prose-neutral max-w-none prose-pre:overflow-x-auto break-words">`.
- Produces: `toDescription(markdown: string, excerpt: string | null, max = 160): string`. Returns the trimmed excerpt if present; otherwise plain text from the Markdown (headings, links, emphasis, code fences and images removed; whitespace collapsed), cut at a word boundary to ≤ `max` chars with `…` added when truncated.

- [ ] **Step 1:** `pnpm add react-markdown remark-gfm rehype-sanitize rehype-highlight @tailwindcss/typography`.
- [ ] **Step 2: Failing tests** `Markdown.test.tsx`:
    - `'# Hi'` renders `<h1>` with text `Hi`.
    - `'<script>alert(1)</script>ok'` → no `script` element in the container, and the text `alert(1)` is not executed as HTML.
    - `'<img src=x onerror=alert(1)>'` → no `img[onerror]`.
    - `'[x](javascript:alert(1))'` → the anchor has no `href` starting with `javascript:`.
    - `'[ext](https://example.com)'` → `target="_blank"`, `rel` contains `noopener`, `noreferrer`, `nofollow`.
    - `'[int](/blog/a)'` → no `target`.
    - GFM table `'|a|b|\n|-|-|\n|1|2|'` → a `table` element.
    - A fenced ` ```ts ` block → `code` has a class containing `hljs`.
- [ ] **Step 3: Failing tests** `describe.test.ts`: excerpt `'  Short  '` → `'Short'`; null excerpt + `'# Title\n\nHello **world** [link](http://a)'` → `'Title Hello world link'`; a 300-char body → length ≤ 161 and ends with `…`; empty input → `''`.
- [ ] **Step 4:** Run `pnpm test` → FAIL. Implement both. `rehype-highlight` runs **after** `rehype-sanitize`. Custom `a` component adds the external-link attrs for `http(s)` hrefs whose host differs from `env.siteUrl`'s host. Run → PASS.
- [ ] **Step 5: Commit** `feat: add blog types and sanitized markdown renderer`.

### Task 3: Public blog pages

**Files:**

- Create: `src/lib/public-api.ts` + `src/lib/public-api.test.ts`; `src/app/(public)/layout.tsx`, `src/app/(public)/page.tsx`, `src/app/(public)/blog/page.tsx`, `src/app/(public)/blog/[slug]/page.tsx`, `src/app/(public)/blog/[slug]/not-found.tsx`; `src/components/public/{SiteHeader,SiteFooter,PostCard,Pagination,SearchForm,LoadError}.tsx`; `src/lib/format-date.ts`
- Modify: `src/app/layout.tsx` (root: `<html lang="en">`, base `metadata` with `metadataBase: new URL(env.siteUrl)`, title template `%s | ${siteName}`); delete the create-next-app `src/app/page.tsx`.

**Interfaces:**

- Consumes: `Blog`, `Paginated`, `Markdown`, `toDescription`, `env`.
- Produces: `listPublishedPosts({ page, q }: { page?: number; q?: string }): Promise<Paginated<Blog> | null>` (null = backend error or unreachable) and `getPublishedPost(slug: string): Promise<Blog | null | 'error'>` (null = 404, `'error'` = other failure). Both use `fetch(..., { next: { revalidate: 60 } })` against `env.backendApiUrl` with `perPage=10`.
- Produces: `formatDate(iso: string): string` using `Intl.DateTimeFormat('en', { dateStyle: 'medium' })`.

- [ ] **Step 1: Failing tests** `public-api.test.ts` with `vi.stubGlobal('fetch', …)`:
    - list calls `${backend}/blogs?currentPage=2&perPage=10&q=react` for `{ page: 2, q: 'react' }`, omits `q` when empty, and returns parsed JSON.
    - list returns `null` when fetch rejects and when the response is 500.
    - get returns `null` on 404, `'error'` on 500 or a rejection, and the Blog on 200. The slug is `encodeURIComponent`-ed.
- [ ] **Step 2:** Run → FAIL. Implement. Run → PASS.
- [ ] **Step 3:** Pages (mobile first, `max-w-3xl mx-auto px-4`):
    - `/`: hero line with the site name, then the 10 latest posts (`PostCard`: title link, date, description) and a "All posts →" link.
    - `/blog`: `SearchForm` (GET form, `name="q"`), list, and `Pagination` (`?page=` and `q` preserved; hidden when there is 1 page; shows "Page x of y"). Empty state: "No posts yet" or "No posts match “q”". `searchParams` is awaited (it is a Promise in current Next).
    - `/blog/[slug]`: title, date (`publishedAt`), `Markdown`. `null` → `notFound()`; `'error'` → `LoadError`. `generateMetadata` gives title, `description: toDescription(...)`, `alternates.canonical: /blog/${slug}`, `openGraph: { type: 'article', publishedTime, modifiedTime: updatedAt, url, title, description }`, `twitter: { card: 'summary_large_image' }`.
    - A list that returns `null` → `LoadError` ("Couldn't load posts right now. Please try again later.").
    - Pages export `revalidate = 60`. No `generateStaticParams`, so the build never calls the backend.
- [ ] **Step 4: Verify.** With the backend running and one published post: `pnpm dev`; check `/`, `/blog`, `/blog?q=x`, `/blog/<slug>`, `/blog/nope` (404 page). `curl -s localhost:5173/blog/<slug> | grep -o '<meta property="og:title"[^>]*>'` → present. Stop the backend → `/blog` shows LoadError without a crash. In the browser pane at 375px: no horizontal scroll, including a post with a long code line.
- [ ] **Step 5:** `pnpm build` with the backend stopped → succeeds.
- [ ] **Step 6: Commit** `feat: server-rendered public blog pages with SEO metadata`.

### Task 4: OG image, sitemap, robots

**Files:**

- Create: `src/app/(public)/blog/[slug]/opengraph-image.tsx`, `src/app/opengraph-image.tsx` (site default), `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/robots.test.ts`

**Interfaces:**

- Consumes: `getPublishedPost`, `listPublishedPosts`, `env`.

- [ ] **Step 1: Failing test** `robots.test.ts`: `robots()` returns `rules` with `allow: '/'` and `disallow` containing `'/admin'`, and `sitemap === `${siteUrl}/sitemap.xml``.
- [ ] **Step 2:** Run → FAIL. Implement `robots.ts`. Run → PASS.
- [ ] **Step 3:** `opengraph-image.tsx` (both): `ImageResponse` from `next/og`, `size = { width: 1200, height: 630 }`, `contentType = 'image/png'`. Dark neutral background, site name small at the top, post title large (≤ 3 lines, clamp font size for long titles). An unknown slug or a backend error renders the site-default card instead of throwing.
- [ ] **Step 4:** `sitemap.ts`: `/`, `/blog`, plus every published post (page through `listPublishedPosts` until all are fetched, `lastModified: updatedAt`). If the backend fails, return only the static entries. Export `revalidate = 3600`.
- [ ] **Step 5: Verify:** `curl -sI localhost:5173/blog/<slug>/opengraph-image` → `200` and `image/png`; open it to check it visually. `/sitemap.xml` lists the post; `/robots.txt` disallows `/admin`. `pnpm build` with the backend stopped → passes.
- [ ] **Step 6: Commit** `feat: generated OG images, sitemap and robots`.

### Task 5: Admin foundation (HTTP client, auth store, guard, layout)

**Files:**

- Create: `src/lib/admin/http.ts` + `http.test.ts`; `src/lib/admin/auth-api.ts`; `src/lib/admin/auth-store.ts`; `src/lib/admin/return-to.ts` + `return-to.test.ts`; `src/proxy.ts` (or `middleware.ts`) + `src/lib/admin/gate.ts` + `gate.test.ts`; `src/app/admin/layout.tsx` (server: metadata noindex, wraps `AdminProviders`); `src/components/admin/AdminProviders.tsx` ('use client': `AntdRegistry`, `ConfigProvider`, `App`, `QueryClientProvider`); `src/components/admin/AdminShell.tsx` ('use client'); `src/components/admin/menu.tsx`; `src/app/admin/(panel)/layout.tsx` (renders `AdminShell`); `src/app/admin/(panel)/page.tsx` (placeholder "Dashboard" for now)

**Interfaces:**

- Produces: `api` (axios instance, `baseURL: env.publicBackendApiUrl`, `withCredentials: true`). The response interceptor on a 401 (not for `/auth/login` or `/auth/refresh` URLs, not already retried) awaits **one shared** `refreshPromise` (`POST /auth/refresh` with plain axios, cleared in `finally`), then retries once. If the refresh fails, it calls `useAuthStore.getState().logout()` and rejects.
- Produces: `login(body: { email: string; password: string })`, `self(): Promise<User>`, `logout()` in `auth-api.ts`.
- Produces: `useAuthStore` (zustand): `{ user: User | null; setUser(u: User): void; logout(): void }`.
- Produces: `safeReturnTo(value: string | null | undefined): string`. Returns the value only if it starts with `/admin`, does not start with `//`, contains no `\`, `..` or `:`; otherwise `'/admin'`.
- Produces: `shouldRedirectToLogin(pathname: string, cookieNames: string[]): boolean`. True when the path is under `/admin`, is not `/admin/login`, and neither `accessToken` nor `refreshToken` is present. The proxy uses it to redirect to `/admin/login?returnTo=<pathname>`. Matcher: `/admin/:path*`.
- Produces: `adminMenu: { key: string; href: string; label: string; icon: ReactNode }[]` (for now Dashboard `/admin` and Blogs `/admin/blogs`).

- [ ] **Step 1:** `pnpm add antd @ant-design/icons @ant-design/nextjs-registry @tanstack/react-query zustand axios`.
- [ ] **Step 2: Failing tests.** `return-to.test.ts`: `/admin/blogs` → same; `null`, `''`, `/blog`, `//evil.com`, `https://evil.com`, `/admin/../x`, `/admin\\evil`, `javascript:alert(1)` → `/admin`. `gate.test.ts`: `/admin` with no cookies → true; with `refreshToken` only → false; `/admin/login` with no cookies → false; `/blog` → false.
- [ ] **Step 3: Failing tests** `http.test.ts` using `axios-mock-adapter` (dev dep) on both `api` and the default axios:
    - 401 then 200 → one refresh call, the original request is retried, and resolves with 200 data.
    - **Two parallel requests both 401 → exactly one refresh call**, both resolve.
    - Refresh fails → `logout` is called and the request rejects.
    - A 401 from `/auth/login` → no refresh attempted.
- [ ] **Step 4:** Run → FAIL. Implement `return-to.ts`, `gate.ts`, `http.ts`, `auth-api.ts`, `auth-store.ts`, `proxy.ts`. Run → PASS.
- [ ] **Step 5:** `AdminShell`: on mount, `useQuery(['self'], self, { retry: false })`. While loading, show a full-screen `Spin`. On error, `router.replace('/admin/login?returnTo=' + pathname)`. On success, `setUser`. Layout uses antd `Grid.useBreakpoint()`:
    - `lg` and up: collapsible light `Sider` with `Menu` (selected key = longest matching `href`).
    - Below `lg`: a header hamburger (`MenuOutlined`) opens a `Drawer` (placement left, closes on navigation) with the same `Menu`.
    - Header right side: avatar dropdown with the user's name and "Logout" (calls `logout`, clears the store and the query cache, then goes to `/admin/login`).
    - Content padding 16px on mobile and 24px on desktop.
- [ ] **Step 6: Verify:** `/admin` with no cookies → redirected by the proxy to `/admin/login?returnTo=%2Fadmin`, where a 404 is fine until Task 6. `pnpm lint && pnpm test && pnpm build` pass. Confirm the public `/blog` page's JS has no antd: run `pnpm build` and check the route's First Load JS size in the build table, which should be roughly the same as before this task.
- [ ] **Step 7: Commit** `feat: admin auth client, route guard and responsive shell`.

### Task 6: Admin login page

**Files:**

- Create: `src/app/admin/login/page.tsx` (server wrapper, noindex, wraps the form in `Suspense`), `src/components/admin/LoginForm.tsx` ('use client') + `LoginForm.test.tsx`; `src/lib/admin/errors.ts` + `errors.test.ts`

**Interfaces:**

- Consumes: `login`, `self`, `useAuthStore`, `safeReturnTo`.
- Produces: `getErrorMessage(err: unknown): string`. For an axios error: 429 → `'Too many login attempts. Please wait 15 minutes and try again.'`; otherwise the first `response.data.errors[0].msg` (backend error format, check `globalErrorHandler.ts`/`validateRequest.ts` for the exact shape), else `response.data.message`; no response → `'Cannot reach the server.'`; fallback `'Something went wrong.'`.
- Produces: `getFieldErrors(err: unknown): { name: string; errors: string[] }[]`, mapping backend validation errors (`path` → `name`) for `form.setFields` (used in Task 8).

- [ ] **Step 1:** Read `pms-backend/src/common/middlewares/globalErrorHandler.ts` and `validateRequest.ts` to get the exact error JSON. Write the `errors.test.ts` fixtures in that shape.
- [ ] **Step 2: Failing tests** `errors.test.ts` for each branch above. `LoginForm.test.tsx` (mock `auth-api` and `next/navigation`):
    - empty submit shows "Please enter your email" / "Please enter your password";
    - success calls `login` then `self`, `setUser`, and `router.replace(safeReturnTo(returnTo))`;
    - a 401 shows the backend message in an `Alert`;
    - the submit button shows loading while pending.
- [ ] **Step 3:** Run → FAIL. Implement. The form is a centered antd `Card` that is full width with 16px gutters on phones and `max-width: 400px` on larger screens. It has `email` (type email, `autoComplete="username"`) and `password` (`autoComplete="current-password"`) fields. If `self` already succeeds on mount, redirect away from login. Run → PASS.
- [ ] **Step 4: Verify with the backend running.** Log in with the owner account from the backend's seed env (the user types it, or read it from `pms-backend/.env.dev` `ADMIN_*` without echoing it). Check: redirect to `/admin`, the shell shows the name, logout works, and a wrong password shows the error. At 375px, the drawer menu works.
- [ ] **Step 5: Commit** `feat: admin login`.

### Task 7: Admin blogs list

**Files:**

- Create: `src/lib/admin/blogs-api.ts`; `src/app/admin/(panel)/blogs/page.tsx`; `src/components/admin/blogs/{BlogsList,BlogsFilter,BlogCardList,StatusTag,DeleteBlogButton}.tsx`; `src/components/admin/blogs/BlogsList.test.tsx`; `src/lib/admin/use-debounced-value.ts`

**Interfaces:**

- Produces in `blogs-api.ts`: `listBlogs(params: { currentPage: number; perPage: number; q?: string; status?: BlogStatus }): Promise<Paginated<Blog>>`, `getBlog(id: number): Promise<Blog>`, `createBlog(body: BlogInput): Promise<Blog>`, `updateBlog(id: number, body: Partial<BlogInput>): Promise<Blog>`, `deleteBlog(id: number): Promise<void>`, with `type BlogInput = { title: string; content: string; slug?: string; excerpt?: string | null; status?: BlogStatus }`.
- Produces: query keys `['blogs', params]` and `['blog', id]`.
- Produces: `DeleteBlogButton({ blog, onDeleted }: { blog: Blog; onDeleted?: () => void })` (Popconfirm "Delete “title”? This cannot be undone."; on success, invalidates `['blogs']` and shows `message.success`).

- [ ] **Step 1: Failing test** `BlogsList.test.tsx` (mock `blogs-api`, render inside a QueryClientProvider):
    - renders the rows' titles and status tags (Draft = default colour, Published = green);
    - typing in search calls `listBlogs` with `q` after the debounce (fake timers, 400ms) and `currentPage` reset to 1;
    - changing the status filter resets to page 1;
    - the empty result shows "No posts yet" with a "New post" button.
- [ ] **Step 2:** Run → FAIL. Implement.
    - `≥ md`: `Table` with columns Title (link to edit), Status, Published/Updated date, Actions (Edit, Delete), and pagination showing `${range[0]}-${range[1]} of ${total}`.
    - `< md`: `BlogCardList` (antd `List` of `Card`s showing title, status tag, date and the two actions) with a simple pager.
    - Filter bar: `Input.Search` + status `Select` (All/Draft/Published) + "New post" button (`/admin/blogs/new`). It stacks vertically on phones.
    - Use `placeholderData: keepPreviousData`.
    - Run → PASS.
- [ ] **Step 3:** Dashboard page `/admin`: two `Statistic` cards with Drafts and Published counts (two `listBlogs` calls with `perPage: 1`, using `total`), plus a "Write a new post" button. On phones the cards stack.
- [ ] **Step 4: Verify** in the browser pane at desktop width and at 375px: search, filter, paging and delete all work; no horizontal scroll.
- [ ] **Step 5: Commit** `feat: admin blog list and dashboard`.

### Task 8: Create / edit blog form

**Files:**

- Create: `src/app/admin/(panel)/blogs/new/page.tsx`, `src/app/admin/(panel)/blogs/[id]/edit/page.tsx`; `src/components/admin/blogs/{BlogForm,MarkdownField,SlugField}.tsx`; `src/components/admin/blogs/BlogForm.test.tsx`; `src/lib/admin/use-unsaved-changes.ts`

**Interfaces:**

- Consumes: `blogs-api`, `getFieldErrors`, `getErrorMessage`, `Markdown`, `DeleteBlogButton`.
- Produces: `BlogForm({ blog }: { blog?: Blog })`. With no `blog` it is create mode, with one it is edit mode.

- [ ] **Step 1:** `pnpm add @uiw/react-md-editor`. `MarkdownField` loads it with `next/dynamic(..., { ssr: false })` and controlled `value`/`onChange`. Set `previewOptions` so its preview uses our `Markdown` component (`components`/`rehypePlugins` with sanitize), or use `preview="edit"` with our own preview pane. On `< md` show antd `Segmented` Write/Preview tabs (one pane at a time, height 60vh); on `≥ md` show the editor and preview side by side (`preview="live"`, height 600).
- [ ] **Step 2: Failing tests** `BlogForm.test.tsx` (mock `blogs-api`, `next/navigation`; mock `MarkdownField` as a `textarea`):
    - title and content are required (messages "Title is required", "Content is required"); title max 200, excerpt max 500;
    - create submits `{ title, content, excerpt, status, slug }`, omitting `slug` when blank, then routes to `/admin/blogs/<id>/edit` and shows `message.success('Post created')`;
    - when the backend returns a slug different from the typed one, an `Alert` shows "Saved with slug “x-2” because “x” was taken.";
    - in edit mode for a published post the slug input is disabled until "Edit slug" is clicked, which first shows a `Modal.confirm` warning "Changing the slug of a published post breaks its existing links and search results.";
    - the backend 400 field errors appear under the matching fields, and the typed values stay in the form;
    - a network or other error shows `getErrorMessage` in an `Alert` and keeps the values.
- [ ] **Step 3:** Run → FAIL. Implement. Layout: single column on phones; on `≥ lg`, the content field takes the main column and a side card holds status (`Radio.Group` Draft/Published), slug, excerpt, Save, and Delete (edit mode). The Save button stays reachable on phones (sticky bottom bar under `md`). Edit sends only the changed fields (`PATCH`). After a successful save, invalidate `['blogs']` and `['blog', id]`, and reset the form's dirty state. Run → PASS.
- [ ] **Step 4:** `useUnsavedChanges(dirty: boolean)`: `beforeunload` warning while dirty, plus a confirm before in-app menu navigation (AdminShell menu clicks check a store flag or `window.confirm`). Edit page: load with `getBlog(Number(id))`. An invalid id or 404 shows an antd `Result` 404 with a "Back to posts" link.
- [ ] **Step 5: Verify (backend running):**
    1. Create a draft and check it is not on the public `/blog`.
    2. Publish it and check it is visible on `/blog` within 60s (or on the next request in dev).
    3. Use `<script>` in the content and check nothing executes in the preview or on the public page.
    4. Create a second post with the same title to see the slug notice.
    5. Delete a post.
    6. Repeat at 375px.
- [ ] **Step 6: Commit** `feat: markdown blog editor with create, edit and delete`.

### Task 9: README, final check, push

**Files:**

- Modify: `README.md`

- [ ] **Step 1:** README sections: what it is; stack; prerequisites (Node, pnpm, `pms-backend` running on 5600 with `CORS_ORIGINS=http://localhost:5173`); setup (`pnpm i`, `cp .env.example .env.local`, `pnpm dev`); env table; scripts; folder map; security model (backend is the real gate; proxy is UX only; sanitized Markdown; headers); planned deployment (`shiamchowdhury.com`, `admin.shiamchowdhury.com`, `api.shiamchowdhury.com`, `MAIN_DOMAIN=shiamchowdhury.com`, host-based routing for `/admin` later, GitHub Actions + EC2 later).
- [ ] **Step 2:** Run `pnpm format && pnpm lint && pnpm test && pnpm build` (backend stopped) → all pass. Paste the summary lines in the task report.
- [ ] **Step 3: Commit** `docs: README with setup, security model and deploy plan`.
- [ ] **Step 4:** `git remote add origin https://github.com/shiamch/pms-frontend.git` (skip if it exists), then `git push -u origin main`. If the remote already has commits, stop and report; do not force push.
