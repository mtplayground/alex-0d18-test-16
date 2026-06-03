"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { createPostAction, type CreatePostState } from "@/actions/posts";
import {
  FileUpload,
  type UploadedAttachment,
} from "@/components/uploads/file-upload";

const initialCreatePostState: CreatePostState = {
  status: "idle",
};

function formatBytes(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.ceil(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function getStatusClasses(status: CreatePostState["status"]) {
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

export function CreatePostForm() {
  const router = useRouter();
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [state, formAction, isPending] = useActionState(
    createPostAction,
    initialCreatePostState
  );

  useEffect(() => {
    if (state.status === "success" && state.postId) {
      router.push(`/posts/${state.postId}`);
      router.refresh();
    }
  }, [router, state.postId, state.status]);

  function handleUploaded(attachment: UploadedAttachment) {
    setAttachments((currentAttachments) => {
      if (
        currentAttachments.some(
          (currentAttachment) => currentAttachment.id === attachment.id
        )
      ) {
        return currentAttachments;
      }

      return [...currentAttachments, attachment].slice(0, 10);
    });
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
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
        <label className="block text-sm font-medium" htmlFor="title">
          Title
        </label>
        <input
          className="border-border bg-surface focus:border-foreground mt-2 w-full rounded-md border px-3 py-2 text-base outline-none"
          id="title"
          name="title"
          type="text"
          maxLength={160}
          aria-describedby="title-error"
          aria-invalid={Boolean(state.fieldErrors?.title)}
          disabled={isPending}
          required
        />
        <FieldError id="title-error" message={state.fieldErrors?.title} />
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="body">
          Body
        </label>
        <textarea
          className="border-border bg-surface focus:border-foreground mt-2 min-h-60 w-full rounded-md border px-3 py-2 text-base outline-none"
          id="body"
          name="body"
          maxLength={20000}
          aria-describedby="body-error"
          aria-invalid={Boolean(state.fieldErrors?.body)}
          disabled={isPending}
          required
        />
        <FieldError id="body-error" message={state.fieldErrors?.body} />
      </div>

      <section
        className="border-border border-t pt-6"
        aria-labelledby="documents-title"
      >
        <div className="mb-4">
          <h2 id="documents-title" className="text-base font-semibold">
            Documents
          </h2>
        </div>
        <FileUpload
          purpose="document"
          label="Upload document"
          disabled={isPending || attachments.length >= 10}
          onUploaded={handleUploaded}
        />

        {attachments.length > 0 ? (
          <ul className="border-border mt-4 space-y-2 border-t pt-4">
            {attachments.map((attachment) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 text-sm"
                key={attachment.id}
              >
                <div>
                  <p className="font-medium">{attachment.fileName}</p>
                  <p className="text-muted mt-1">
                    {attachment.contentType} ·{" "}
                    {formatBytes(attachment.sizeBytes)}
                  </p>
                </div>
                <button
                  className="border-border rounded-md border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                  type="button"
                  disabled={isPending}
                  onClick={() => removeAttachment(attachment.id)}
                >
                  Remove
                </button>
                <input
                  name="attachmentIds"
                  type="hidden"
                  value={attachment.id}
                />
              </li>
            ))}
          </ul>
        ) : null}

        <FieldError
          id="attachmentIds-error"
          message={state.fieldErrors?.attachmentIds}
        />
      </section>

      <button
        className="bg-foreground text-surface rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Creating..." : "Create post"}
      </button>
    </form>
  );
}
