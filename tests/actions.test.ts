import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  hashPassword: vi.fn(),
  revalidatePath: vi.fn(),
  prisma: {
    $transaction: vi.fn(),
    attachment: {
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    post: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    reply: {
      create: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/password", () => ({
  hashPassword: mocks.hashPassword,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { signUpAction } from "@/actions/auth";
import { createPostAction } from "@/actions/posts";
import { createReplyAction } from "@/actions/replies";

function buildFormData(fields: Record<string, string | string[]>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    const values = Array.isArray(value) ? value : [value];

    for (const item of values) {
      formData.append(key, item);
    }
  }

  return formData;
}

beforeEach(() => {
  vi.resetAllMocks();

  mocks.prisma.$transaction.mockImplementation(async (callback) =>
    callback({
      attachment: {
        updateMany: mocks.prisma.attachment.updateMany,
      },
      post: {
        create: mocks.prisma.post.create,
      },
    })
  );
});

describe("signUpAction", () => {
  it("returns field errors for invalid sign-up input", async () => {
    const result = await signUpAction(
      { status: "idle" },
      buildFormData({
        displayName: "A",
        email: "not-an-email",
        password: "short",
      })
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toEqual({
      displayName: "Display name must be at least 2 characters",
      email: "Enter a valid email address",
      password: "Password must be at least 8 characters",
    });
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });

  it("creates users with normalized email and hashed password", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.prisma.user.create.mockResolvedValue({ id: "user-1" });

    const result = await signUpAction(
      { status: "idle" },
      buildFormData({
        displayName: "  Ada Lovelace  ",
        email: "ADA@EXAMPLE.COM",
        password: "secure-password",
      })
    );

    expect(result).toEqual({
      status: "success",
      message: "Account created.",
    });
    expect(mocks.hashPassword).toHaveBeenCalledWith("secure-password");
    expect(mocks.prisma.user.create).toHaveBeenCalledWith({
      data: {
        displayName: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed-password",
      },
    });
  });

  it("rejects duplicate emails before hashing", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "existing-user" });

    const result = await signUpAction(
      { status: "idle" },
      buildFormData({
        displayName: "Ada Lovelace",
        email: "ada@example.com",
        password: "secure-password",
      })
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.email).toBe(
      "An account already exists for that email."
    );
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("createPostAction", () => {
  it("requires an authenticated user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await createPostAction(
      { status: "idle" },
      buildFormData({
        title: "A useful post",
        body: "Body",
        attachmentIds: [],
      })
    );

    expect(result).toEqual({
      status: "error",
      message: "You must sign in before creating a post.",
    });
    expect(mocks.prisma.post.create).not.toHaveBeenCalled();
  });

  it("returns validation errors for invalid post fields", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });

    const result = await createPostAction(
      { status: "idle" },
      buildFormData({
        title: "No",
        body: "",
      })
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toEqual({
      title: "Title must be at least 3 characters",
      body: "Body is required",
    });
    expect(mocks.prisma.post.create).not.toHaveBeenCalled();
  });

  it("creates a post and associates available document attachments", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.attachment.count.mockResolvedValue(2);
    mocks.prisma.post.create.mockResolvedValue({ id: "post-1" });
    mocks.prisma.attachment.updateMany.mockResolvedValue({ count: 2 });

    const result = await createPostAction(
      { status: "idle" },
      buildFormData({
        title: "  A useful post  ",
        body: "  Body text  ",
        attachmentIds: ["attachment-1", "attachment-2", "attachment-1"],
      })
    );

    expect(result).toEqual({
      status: "success",
      message: "Post created.",
      postId: "post-1",
    });
    expect(mocks.prisma.attachment.count).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["attachment-1", "attachment-2"],
        },
        contentType: {
          in: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
          ],
        },
        postId: null,
      },
    });
    expect(mocks.prisma.post.create).toHaveBeenCalledWith({
      data: {
        title: "A useful post",
        body: "Body text",
        authorId: "user-1",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.prisma.attachment.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["attachment-1", "attachment-2"],
        },
        contentType: {
          in: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
          ],
        },
        postId: null,
      },
      data: {
        postId: "post-1",
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
  });

  it("rejects unavailable attachments", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.attachment.count.mockResolvedValue(0);

    const result = await createPostAction(
      { status: "idle" },
      buildFormData({
        title: "A useful post",
        body: "Body text",
        attachmentIds: "attachment-1",
      })
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.attachmentIds).toBe(
      "Upload documents before creating the post."
    );
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("createReplyAction", () => {
  it("requires an authenticated user", async () => {
    mocks.auth.mockResolvedValue(null);

    const result = await createReplyAction(
      { status: "idle" },
      buildFormData({
        postId: "post-1",
        body: "Reply",
      })
    );

    expect(result).toEqual({
      status: "error",
      message: "You must sign in before replying.",
    });
    expect(mocks.prisma.reply.create).not.toHaveBeenCalled();
  });

  it("rejects replies for missing posts", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.post.findUnique.mockResolvedValue(null);

    const result = await createReplyAction(
      { status: "idle" },
      buildFormData({
        postId: "missing-post",
        body: "Reply",
      })
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.postId).toBe("Post not found.");
    expect(mocks.prisma.reply.create).not.toHaveBeenCalled();
  });

  it("creates replies and revalidates the post detail page", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.prisma.post.findUnique.mockResolvedValue({ id: "post-1" });
    mocks.prisma.reply.create.mockResolvedValue({ id: "reply-1" });

    const result = await createReplyAction(
      { status: "idle" },
      buildFormData({
        postId: "post-1",
        body: "  Reply body  ",
      })
    );

    expect(result).toEqual({
      status: "success",
      message: "Reply created.",
      replyId: "reply-1",
      postId: "post-1",
    });
    expect(mocks.prisma.reply.create).toHaveBeenCalledWith({
      data: {
        body: "Reply body",
        authorId: "user-1",
        postId: "post-1",
      },
      select: {
        id: true,
      },
    });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/posts/post-1");
  });
});
