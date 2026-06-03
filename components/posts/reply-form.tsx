"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";

import { createReplyAction, type CreateReplyState } from "@/actions/replies";

const initialCreateReplyState: CreateReplyState = {
  status: "idle",
};

type ReplyFormProps = Readonly<{
  postId: string;
}>;

function getStatusClasses(status: CreateReplyState["status"]) {
  if (status === "success") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  return "border-red-200 bg-red-50 text-red-800";
}

function FieldError({
  id,
  message,
}: Readonly<{
  id: string;
  message?: string;
}>) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-red-700" id={id}>
      {message}
    </p>
  );
}

export function ReplyForm({ postId }: ReplyFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    createReplyAction,
    initialCreateReplyState
  );

  useEffect(() => {
    if (state.status === "success" && state.replyId) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.replyId, state.status]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
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

      <input name="postId" type="hidden" value={postId} />
      <FieldError id="postId-error" message={state.fieldErrors?.postId} />

      <div>
        <label className="block text-sm font-medium" htmlFor="reply-body">
          Reply
        </label>
        <textarea
          className="border-border bg-surface focus:border-foreground mt-2 min-h-36 w-full rounded-md border px-3 py-2 text-base outline-none"
          id="reply-body"
          name="body"
          maxLength={5000}
          aria-describedby="reply-body-error"
          aria-invalid={Boolean(state.fieldErrors?.body)}
          disabled={isPending}
          required
        />
        <FieldError id="reply-body-error" message={state.fieldErrors?.body} />
      </div>

      <button
        className="bg-foreground text-surface rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Replying..." : "Post reply"}
      </button>
    </form>
  );
}
