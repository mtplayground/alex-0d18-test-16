export default function Loading() {
  return (
    <main className="bg-background text-foreground grid min-h-screen place-items-center p-8">
      <div
        className="border-muted h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
        role="status"
        aria-label="Loading"
      />
    </main>
  );
}
