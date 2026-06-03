import type { ReactNode } from "react";

type PublicLayoutProps = Readonly<{
  children: ReactNode;
}>;

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="grid min-h-screen place-items-center p-8">
        {children}
      </main>
    </div>
  );
}
