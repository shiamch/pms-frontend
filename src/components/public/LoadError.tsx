/** Friendly message shown when the backend can't be reached. */
export const LoadError = ({ message = "Couldn't load posts right now. Please try again later." }) => (
    <p role="alert" className="rounded-lg bg-amber-50 px-4 py-3 text-amber-900">
        {message}
    </p>
)
