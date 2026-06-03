import Link from "next/link";
import type { ReactNode } from "react";

type AuthenticatedLayoutProps = Readonly<{
  children: ReactNode;
}>;

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link className="text-sm font-semibold" href="/">
            Home
          </Link>
          <nav className="flex items-center gap-4" aria-label="Primary">
            <Link className="text-muted text-sm font-medium" href="/">
              Feed
            </Link>
            <Link
              className="bg-foreground text-surface rounded-md px-3 py-2 text-sm font-semibold"
              href="/posts/new"
            >
              New post
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
