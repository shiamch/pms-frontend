/** Plain GET search form, works without JavaScript. */
export const SearchForm = ({ q = '' }: { q?: string }) => (
    <form action="/blog" method="get" role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
            Search posts
        </label>
        <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search posts"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-neutral-900"
        />
        <button
            type="submit"
            className="shrink-0 rounded-lg bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700"
        >
            Search
        </button>
    </form>
)
