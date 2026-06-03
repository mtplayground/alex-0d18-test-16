import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-background text-foreground grid min-h-screen place-items-center p-8">
      <section
        className="border-border bg-surface w-full max-w-xl rounded-lg border p-8"
        aria-labelledby="not-found-title"
      >
        <p className="text-muted mb-3 text-sm font-bold uppercase">404</p>
        <h1 id="not-found-title" className="mb-4 text-3xl font-bold">
          Page not found
        </h1>
        <Link
          className="text-foreground text-sm font-semibold underline underline-offset-4"
          href="/"
        >
          Go home
        </Link>
      </section>
    </main>
  );
}
