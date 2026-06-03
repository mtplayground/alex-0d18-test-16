"use client";

import { useActionState } from "react";

import { signUpAction, type SignUpState } from "@/actions/auth";

const initialSignUpState: SignUpState = {
  status: "idle",
};

type FieldErrorProps = Readonly<{
  id: string;
  message?: string;
}>;

function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-red-700" id={id}>
      {message}
    </p>
  );
}

function getStatusClasses(status: SignUpState["status"]) {
  if (status === "success") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  return "border-red-200 bg-red-50 text-red-800";
}

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    initialSignUpState
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${getStatusClasses(
            state.status
          )}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium" htmlFor="displayName">
          Display name
        </label>
        <input
          className="border-border bg-surface focus:border-foreground mt-2 w-full rounded-md border px-3 py-2 text-base outline-none"
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          aria-describedby="displayName-error"
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
          required
        />
        <FieldError
          id="displayName-error"
          message={state.fieldErrors?.displayName}
        />
      </div>

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
          aria-invalid={Boolean(state.fieldErrors?.email)}
          required
        />
        <FieldError id="email-error" message={state.fieldErrors?.email} />
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
          autoComplete="new-password"
          aria-describedby="password-error"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          required
        />
        <FieldError id="password-error" message={state.fieldErrors?.password} />
      </div>

      <button
        className="bg-foreground text-surface w-full rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
