"use client";

type ErrorBoundaryProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <main className="bg-background text-foreground grid min-h-screen place-items-center p-8">
      <section
        className="border-border bg-surface w-full max-w-xl rounded-lg border p-8"
        aria-labelledby="error-title"
      >
        <p className="text-muted mb-3 text-sm font-bold uppercase">
          Error{error.digest ? ` ${error.digest}` : ""}
        </p>
        <h1 id="error-title" className="mb-4 text-3xl font-bold">
          Something went wrong
        </h1>
        <button
          className="bg-foreground text-surface rounded-md px-4 py-2 text-sm font-semibold"
          type="button"
          onClick={reset}
        >
          Try again
        </button>
      </section>
    </main>
  );
}
