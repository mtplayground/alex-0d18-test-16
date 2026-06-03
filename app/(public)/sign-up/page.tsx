import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <section
      className="border-border bg-surface w-full max-w-md rounded-lg border p-8"
      aria-labelledby="sign-up-title"
    >
      <div className="mb-6">
        <h1 id="sign-up-title" className="text-3xl font-bold">
          Create account
        </h1>
      </div>
      <SignUpForm />
    </section>
  );
}
