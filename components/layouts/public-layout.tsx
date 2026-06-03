import type { ReactNode } from "react";
import Link from "next/link";

type PublicLayoutProps = Readonly<{
  children: ReactNode;
}>;

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border bg-surface border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
          <Link className="text-sm font-semibold" href="/">
            Home
          </Link>
          <nav className="flex items-center gap-4" aria-label="Primary">
            <Link className="text-muted text-sm font-medium" href="/sign-in">
              Sign in
            </Link>
            <Link
              className="bg-foreground text-surface rounded-md px-3 py-2 text-sm font-semibold"
              href="/sign-up"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
