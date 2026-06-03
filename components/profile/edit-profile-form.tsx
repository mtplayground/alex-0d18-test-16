"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import {
  updateProfileAction,
  type UpdateProfileState,
} from "@/actions/profile";
import {
  FileUpload,
  type UploadedAttachment,
} from "@/components/uploads/file-upload";

const initialUpdateProfileState: UpdateProfileState = {
  status: "idle",
};

type EditProfileFormProps = Readonly<{
  user: {
    displayName: string;
    avatarUrl: string | null;
  };
}>;

function getStatusClasses(status: UpdateProfileState["status"]) {
  if (status === "success") {
    return "border-green-200 bg-green-50 text-green-800";
  }

  return "border-red-200 bg-red-50 text-red-800";
}

function getInitials(displayName: string) {
  return displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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

function AvatarPreview({
  avatarUrl,
  displayName,
}: Readonly<{
  avatarUrl?: string | null;
  displayName: string;
}>) {
  if (avatarUrl) {
    return (
      <div
        className="border-border h-20 w-20 rounded-full border bg-cover bg-center"
        role="img"
        aria-label={`${displayName} avatar`}
        style={{
          backgroundImage: `url(${avatarUrl})`,
        }}
      />
    );
  }

  return (
    <div
      className="border-border bg-background flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-bold"
      aria-hidden="true"
    >
      {getInitials(displayName) || "U"}
    </div>
  );
}

export function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter();
  const [uploadedAvatar, setUploadedAvatar] = useState<UploadedAttachment>();
  const [uploadResetKey, setUploadResetKey] = useState(0);
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    initialUpdateProfileState
  );
  const displayName = state.displayName ?? user.displayName;
  const avatarUrl = state.avatarUrl ?? uploadedAvatar?.url ?? user.avatarUrl;

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.avatarUrl, state.displayName, state.status]);

  function handleFormAction(formData: FormData) {
    formAction(formData);

    if (uploadedAvatar) {
      setUploadedAvatar(undefined);
      setUploadResetKey((currentKey) => currentKey + 1);
    }
  }

  return (
    <form action={handleFormAction} className="space-y-6" noValidate>
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

      <div className="flex flex-wrap items-center gap-5">
        <AvatarPreview avatarUrl={avatarUrl} displayName={displayName} />
        <FileUpload
          key={uploadResetKey}
          purpose="avatar"
          label="Upload avatar"
          disabled={isPending}
          onUploaded={setUploadedAvatar}
        />
      </div>

      {uploadedAvatar ? (
        <input
          name="avatarAttachmentId"
          type="hidden"
          value={uploadedAvatar.id}
        />
      ) : null}
      <FieldError
        id="avatarAttachmentId-error"
        message={state.fieldErrors?.avatarAttachmentId}
      />

      <div>
        <label className="block text-sm font-medium" htmlFor="displayName">
          Display name
        </label>
        <input
          className="border-border bg-surface focus:border-foreground mt-2 w-full rounded-md border px-3 py-2 text-base outline-none"
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName}
          maxLength={80}
          aria-describedby="displayName-error"
          aria-invalid={Boolean(state.fieldErrors?.displayName)}
          disabled={isPending}
          required
        />
        <FieldError
          id="displayName-error"
          message={state.fieldErrors?.displayName}
        />
      </div>

      <button
        className="bg-foreground text-surface rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
