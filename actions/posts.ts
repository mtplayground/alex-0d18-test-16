"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allowedUploadContentTypes } from "@/lib/upload-validation";

const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(160, "Title must be 160 characters or less"),
  body: z
    .string()
    .trim()
    .min(1, "Body is required")
    .max(20000, "Body must be 20000 characters or less"),
  attachmentIds: z
    .array(z.string().trim().min(1, "Attachment id is required"))
    .max(10, "A post can include up to 10 attachments"),
});

type CreatePostField = "title" | "body" | "attachmentIds";

class AttachmentAssociationError extends Error {
  constructor() {
    super("Attachment association failed.");
  }
}

export type CreatePostState = {
  status: "idle" | "error" | "success";
  message?: string;
  postId?: string;
  fieldErrors?: Partial<Record<CreatePostField, string>>;
};

function toFieldErrors(error: z.ZodError): CreatePostState["fieldErrors"] {
  const fieldErrors: CreatePostState["fieldErrors"] = {};
  const fields = new Set<CreatePostField>(["title", "body", "attachmentIds"]);

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && fields.has(field as CreatePostField)) {
      const createPostField = field as CreatePostField;
      fieldErrors[createPostField] ??= issue.message;
    }
  }

  return fieldErrors;
}

function getAttachmentIds(formData: FormData) {
  const values = formData
    .getAll("attachmentIds")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set(values));
}

function unavailableAttachmentState(): CreatePostState {
  return {
    status: "error",
    message: "One or more attachments are unavailable.",
    fieldErrors: {
      attachmentIds: "Upload documents before creating the post.",
    },
  };
}

export async function createPostAction(
  _previousState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const session = await auth();
  const authorId = session?.user?.id;

  if (!authorId) {
    return {
      status: "error",
      message: "You must sign in before creating a post.",
    };
  }

  const parsed = createPostSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    attachmentIds: getAttachmentIds(formData),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { attachmentIds, body, title } = parsed.data;

  if (attachmentIds.length > 0) {
    const attachmentCount = await prisma.attachment.count({
      where: {
        id: {
          in: attachmentIds,
        },
        contentType: {
          in: [...allowedUploadContentTypes.document],
        },
        postId: null,
      },
    });

    if (attachmentCount !== attachmentIds.length) {
      return unavailableAttachmentState();
    }
  }

  try {
    const post = await prisma.$transaction(async (transaction) => {
      const createdPost = await transaction.post.create({
        data: {
          title,
          body,
          authorId,
        },
        select: {
          id: true,
        },
      });

      if (attachmentIds.length > 0) {
        const update = await transaction.attachment.updateMany({
          where: {
            id: {
              in: attachmentIds,
            },
            contentType: {
              in: [...allowedUploadContentTypes.document],
            },
            postId: null,
          },
          data: {
            postId: createdPost.id,
          },
        });

        if (update.count !== attachmentIds.length) {
          throw new AttachmentAssociationError();
        }
      }

      return createdPost;
    });

    revalidatePath("/");

    return {
      status: "success",
      message: "Post created.",
      postId: post.id,
    };
  } catch (error) {
    if (error instanceof AttachmentAssociationError) {
      return unavailableAttachmentState();
    }

    throw error;
  }
}
