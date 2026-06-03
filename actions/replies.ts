"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createReplySchema = z.object({
  postId: z.string().trim().min(1, "Post is required"),
  body: z
    .string()
    .trim()
    .min(1, "Reply body is required")
    .max(5000, "Reply body must be 5000 characters or less"),
});

type CreateReplyField = "postId" | "body";

export type CreateReplyState = {
  status: "idle" | "error" | "success";
  message?: string;
  replyId?: string;
  postId?: string;
  fieldErrors?: Partial<Record<CreateReplyField, string>>;
};

function toFieldErrors(error: z.ZodError): CreateReplyState["fieldErrors"] {
  const fieldErrors: CreateReplyState["fieldErrors"] = {};
  const fields = new Set<CreateReplyField>(["postId", "body"]);

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && fields.has(field as CreateReplyField)) {
      const createReplyField = field as CreateReplyField;
      fieldErrors[createReplyField] ??= issue.message;
    }
  }

  return fieldErrors;
}

export async function createReplyAction(
  _previousState: CreateReplyState,
  formData: FormData
): Promise<CreateReplyState> {
  const session = await auth();
  const authorId = session?.user?.id;

  if (!authorId) {
    return {
      status: "error",
      message: "You must sign in before replying.",
    };
  }

  const parsed = createReplySchema.safeParse({
    postId: formData.get("postId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const post = await prisma.post.findUnique({
    where: {
      id: parsed.data.postId,
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    return {
      status: "error",
      message: "Post not found.",
      fieldErrors: {
        postId: "Post not found.",
      },
    };
  }

  const reply = await prisma.reply.create({
    data: {
      body: parsed.data.body,
      authorId,
      postId: post.id,
    },
    select: {
      id: true,
    },
  });

  revalidatePath(`/posts/${post.id}`);

  return {
    status: "success",
    message: "Reply created.",
    replyId: reply.id,
    postId: post.id,
  };
}
