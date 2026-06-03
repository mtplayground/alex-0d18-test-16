import Link from "next/link";

export default function HomePage() {
  return (
    <section
      className="border-border bg-surface w-full max-w-2xl rounded-lg border p-8"
      aria-labelledby="page-title"
    >
      <p className="text-muted mb-3 text-sm font-bold uppercase">Issue #1</p>
      <h1
        id="page-title"
        className="mb-4 text-4xl leading-tight font-bold sm:text-5xl"
      >
        Next.js App Router scaffold
      </h1>
      <p className="text-muted text-lg leading-7">
        The TypeScript application foundation is ready for the feature issues
        that follow.
      </p>
      <Link
        className="bg-foreground text-surface mt-6 inline-flex rounded-md px-4 py-2 text-sm font-semibold"
        href="/sign-up"
      >
        Create account
      </Link>
    </section>
  );
}
