import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";

type SignInPageProps = Readonly<{
  searchParams: Promise<{
    callbackUrl?: string | string[];
  }>;
}>;

function getSafeCallbackUrl(value: string | string[] | undefined) {
  const callbackUrl = Array.isArray(value) ? value[0] : value;

  if (
    callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
  ) {
    return callbackUrl;
  }

  return "/";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <section
      className="border-border bg-surface w-full max-w-md rounded-lg border p-8"
      aria-labelledby="sign-in-title"
    >
      <div className="mb-6">
        <h1 id="sign-in-title" className="text-3xl font-bold">
          Sign in
        </h1>
      </div>
      <SignInForm callbackUrl={getSafeCallbackUrl(callbackUrl)} />
      <p className="text-muted mt-6 text-sm">
        Need an account?{" "}
        <Link
          className="text-foreground font-semibold underline underline-offset-4"
          href="/sign-up"
        >
          Create one
        </Link>
      </p>
    </section>
  );
}
