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

type UpdateAvatarField = "avatarAttachmentId";

export type UpdateAvatarState = {
  status: "idle" | "error" | "success";
  message?: string;
  avatarUrl?: string;
  fieldErrors?: Partial<Record<UpdateAvatarField, string>>;
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

function unavailableAvatarState(): UpdateAvatarState {
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
