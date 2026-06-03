"use client";

import Link from "next/link";

type GlobalErrorBoundaryProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function GlobalErrorBoundary({
  error,
  reset,
}: GlobalErrorBoundaryProps) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-neutral-50 p-8 text-neutral-950">
          <section
            className="w-full max-w-xl rounded-lg border border-neutral-200 bg-white p-8"
            aria-labelledby="global-error-title"
          >
            <p className="mb-3 text-sm font-bold text-neutral-500 uppercase">
              Error{error.digest ? ` ${error.digest}` : ""}
            </p>
            <h1 id="global-error-title" className="mb-4 text-3xl font-bold">
              Something went wrong
            </h1>
            <p className="mb-6 leading-7 text-neutral-600">
              The application could not render this request. Retry the request
              or return to the home page.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
                type="button"
                onClick={reset}
              >
                Try again
              </button>
              <Link
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold"
                href="/"
              >
                Go home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
