"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteObject, getObjectUrl } from "@/lib/storage";
import { allowedUploadContentTypes } from "@/lib/upload-validation";

const updateAvatarSchema = z.object({
  avatarAttachmentId: z.string().trim().min(1, "Upload an avatar image first"),
});

const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(80, "Display name must be 80 characters or less"),
  avatarAttachmentId: z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
  }, z.string().optional()),
});

type UpdateAvatarField = "avatarAttachmentId";
type UpdateProfileField = "displayName" | "avatarAttachmentId";

export type UpdateAvatarState = {
  status: "idle" | "error" | "success";
  message?: string;
  avatarUrl?: string;
  fieldErrors?: Partial<Record<UpdateAvatarField, string>>;
};

export type UpdateProfileState = {
  status: "idle" | "error" | "success";
  message?: string;
  displayName?: string;
  avatarUrl?: string | null;
  fieldErrors?: Partial<Record<UpdateProfileField, string>>;
};

function toFieldErrors(error: z.ZodError): UpdateAvatarState["fieldErrors"] {
  const fieldErrors: UpdateAvatarState["fieldErrors"] = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (field === "avatarAttachmentId") {
      fieldErrors.avatarAttachmentId ??= issue.message;
    }
  }

  return fieldErrors;
}

function toProfileFieldErrors(
  error: z.ZodError
): UpdateProfileState["fieldErrors"] {
  const fieldErrors: UpdateProfileState["fieldErrors"] = {};
  const fields = new Set<UpdateProfileField>([
    "displayName",
    "avatarAttachmentId",
  ]);

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && fields.has(field as UpdateProfileField)) {
      const updateProfileField = field as UpdateProfileField;
      fieldErrors[updateProfileField] ??= issue.message;
    }
  }

  return fieldErrors;
}

function unavailableAvatarState(): UpdateAvatarState {
  return {
    status: "error",
    message: "Uploaded avatar is unavailable.",
    fieldErrors: {
      avatarAttachmentId: "Upload an avatar image first.",
    },
  };
}

function unavailableProfileAvatarState(): UpdateProfileState {
  return {
    status: "error",
    message: "Uploaded avatar is unavailable.",
    fieldErrors: {
      avatarAttachmentId: "Upload an avatar image first.",
    },
  };
}

export async function updateAvatarAction(
  _previousState: UpdateAvatarState,
  formData: FormData
): Promise<UpdateAvatarState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      status: "error",
      message: "You must sign in before updating your avatar.",
    };
  }

  const parsed = updateAvatarSchema.safeParse({
    avatarAttachmentId: formData.get("avatarAttachmentId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const attachment = await prisma.attachment.findFirst({
    where: {
      id: parsed.data.avatarAttachmentId,
      contentType: {
        in: [...allowedUploadContentTypes.avatar],
      },
      postId: null,
    },
    select: {
      id: true,
      storageKey: true,
    },
  });

  if (!attachment) {
    return unavailableAvatarState();
  }

  const avatarUrl = getObjectUrl(attachment.storageKey);
  const previousUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      avatarStorageKey: true,
    },
  });

  if (!previousUser) {
    return {
      status: "error",
      message: "User account was not found.",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        avatarStorageKey: attachment.storageKey,
        avatarUrl,
      },
    }),
    prisma.attachment.delete({
      where: {
        id: attachment.id,
      },
    }),
  ]);

  if (
    previousUser.avatarStorageKey &&
    previousUser.avatarStorageKey !== attachment.storageKey
  ) {
    await deleteObject(previousUser.avatarStorageKey).catch((error) => {
      console.error("Unable to delete previous avatar object", error);
    });
  }

  revalidatePath("/");
  revalidatePath(`/users/${userId}`);

  return {
    status: "success",
    message: "Avatar updated.",
    avatarUrl,
  };
}

export async function updateProfileAction(
  _previousState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      status: "error",
      message: "You must sign in before updating your profile.",
    };
  }

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    avatarAttachmentId: formData.get("avatarAttachmentId"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: toProfileFieldErrors(parsed.error),
    };
  }

  const previousUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      avatarStorageKey: true,
      avatarUrl: true,
    },
  });

  if (!previousUser) {
    return {
      status: "error",
      message: "User account was not found.",
    };
  }

  const avatarAttachmentId = parsed.data.avatarAttachmentId;
  const avatarAttachment = avatarAttachmentId
    ? await prisma.attachment.findFirst({
        where: {
          id: avatarAttachmentId,
          contentType: {
            in: [...allowedUploadContentTypes.avatar],
          },
          postId: null,
        },
        select: {
          id: true,
          storageKey: true,
        },
      })
    : undefined;

  if (avatarAttachmentId && !avatarAttachment) {
    return unavailableProfileAvatarState();
  }

  const avatarUrl = avatarAttachment
    ? getObjectUrl(avatarAttachment.storageKey)
    : previousUser.avatarUrl;

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        displayName: parsed.data.displayName,
        avatarStorageKey: avatarAttachment?.storageKey,
        avatarUrl,
      },
    }),
    ...(avatarAttachment
      ? [
          prisma.attachment.delete({
            where: {
              id: avatarAttachment.id,
            },
          }),
        ]
      : []),
  ]);

  if (
    avatarAttachment &&
    previousUser.avatarStorageKey &&
    previousUser.avatarStorageKey !== avatarAttachment.storageKey
  ) {
    await deleteObject(previousUser.avatarStorageKey).catch((error) => {
      console.error("Unable to delete previous avatar object", error);
    });
  }

  revalidatePath("/");
  revalidatePath("/profile/edit");
  revalidatePath(`/users/${userId}`);

  return {
    status: "success",
    message: "Profile updated.",
    displayName: parsed.data.displayName,
    avatarUrl,
  };
}
