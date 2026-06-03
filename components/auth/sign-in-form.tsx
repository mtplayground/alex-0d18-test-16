"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type SignInFieldErrors = Partial<{
  email: string;
  password: string;
}>;

type SignInFormProps = Readonly<{
  callbackUrl?: string;
}>;

function getStringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function SignInForm({ callbackUrl = "/" }: SignInFormProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = getStringField(formData, "email").toLowerCase();
    const password = getStringField(formData, "password");
    const nextFieldErrors: SignInFieldErrors = {};

    if (!email) {
      nextFieldErrors.email = "Email is required.";
    }

    if (!password) {
      nextFieldErrors.password = "Password is required.";
    }

    setFieldErrors(nextFieldErrors);
    setFormError(undefined);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    setIsPending(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setFormError("Invalid email or password.");
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setFormError("Unable to sign in. Try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          className="border-border bg-surface focus:border-foreground mt-2 w-full rounded-md border px-3 py-2 text-base outline-none"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          aria-describedby="email-error"
          aria-invalid={Boolean(fieldErrors.email)}
          required
        />
        {fieldErrors.email ? (
          <p className="mt-2 text-sm text-red-700" id="email-error">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          className="border-border bg-surface focus:border-foreground mt-2 w-full rounded-md border px-3 py-2 text-base outline-none"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-describedby="password-error"
          aria-invalid={Boolean(fieldErrors.password)}
          required
        />
        {fieldErrors.password ? (
          <p className="mt-2 text-sm text-red-700" id="password-error">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <button
        className="bg-foreground text-surface w-full rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
