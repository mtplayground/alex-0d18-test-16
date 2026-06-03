import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  deleteObject: vi.fn(),
  uploadObject: vi.fn(),
  prisma: {
    attachment: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/storage", () => ({
  deleteObject: mocks.deleteObject,
  uploadObject: mocks.uploadObject,
}));

import { POST } from "@/app/api/upload/route";

function createUploadRequest(fields: {
  file?: File;
  purpose?: string;
}): Request {
  const formData = new FormData();

  if (fields.purpose !== undefined) {
    formData.set("purpose", fields.purpose);
  }

  if (fields.file) {
    formData.set("file", fields.file);
  }

  return new Request("http://localhost:8080/api/upload", {
    method: "POST",
    body: formData,
  });
}

async function responseJson(response: Response) {
  return (await response.json()) as unknown;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.deleteObject.mockResolvedValue(undefined);
});

describe("upload API route", () => {
  it("rejects unauthenticated uploads", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST(
      createUploadRequest({
        purpose: "document",
        file: new File(["hello"], "hello.txt", { type: "text/plain" }),
      })
    );

    expect(response.status).toBe(401);
    expect(await responseJson(response)).toEqual({
      error: "Authentication is required.",
    });
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects files that do not match the upload purpose", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });

    const response = await POST(
      createUploadRequest({
        purpose: "avatar",
        file: new File(["%PDF"], "document.pdf", {
          type: "application/pdf",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toEqual({
      error: "File type is not allowed for this upload purpose.",
    });
    expect(mocks.uploadObject).not.toHaveBeenCalled();
    expect(mocks.prisma.attachment.create).not.toHaveBeenCalled();
  });

  it("uploads valid files and records an attachment", async () => {
    const createdAt = new Date("2026-06-03T09:00:00.000Z");
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.uploadObject.mockResolvedValue({
      key: "documents/user-1/generated-report.txt",
      url: "https://assets.example.com/documents/user-1/generated-report.txt",
    });
    mocks.prisma.attachment.create.mockResolvedValue({
      id: "attachment-1",
      fileName: "report.txt",
      contentType: "text/plain",
      sizeBytes: 12,
      storageKey: "documents/user-1/generated-report.txt",
      createdAt,
    });

    const response = await POST(
      createUploadRequest({
        purpose: "document",
        file: new File(["hello report"], "report.txt", {
          type: "text/plain",
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        contentLength: 12,
        contentType: "text/plain",
        metadata: {
          originalFileName: "report.txt",
          purpose: "document",
          userId: "user-1",
        },
      })
    );
    expect(mocks.uploadObject.mock.calls[0]?.[0].key).toMatch(
      /^documents\/user-1\/.+-report\.txt$/
    );
    expect(mocks.prisma.attachment.create).toHaveBeenCalledWith({
      data: {
        fileName: "report.txt",
        contentType: "text/plain",
        sizeBytes: 12,
        storageKey: "documents/user-1/generated-report.txt",
      },
      select: {
        id: true,
        fileName: true,
        contentType: true,
        sizeBytes: true,
        storageKey: true,
        createdAt: true,
      },
    });
    expect(await responseJson(response)).toEqual({
      attachment: {
        id: "attachment-1",
        fileName: "report.txt",
        contentType: "text/plain",
        sizeBytes: 12,
        storageKey: "documents/user-1/generated-report.txt",
        createdAt: createdAt.toISOString(),
        purpose: "document",
        url: "https://assets.example.com/documents/user-1/generated-report.txt",
      },
    });
  });

  it("deletes uploaded objects when attachment creation fails", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "user-1" } });
    mocks.uploadObject.mockResolvedValue({
      key: "documents/user-1/generated-report.txt",
      url: "https://assets.example.com/documents/user-1/generated-report.txt",
    });
    mocks.prisma.attachment.create.mockRejectedValue(
      new Error("database unavailable")
    );

    const response = await POST(
      createUploadRequest({
        purpose: "document",
        file: new File(["hello report"], "report.txt", {
          type: "text/plain",
        }),
      })
    );

    expect(response.status).toBe(500);
    expect(await responseJson(response)).toEqual({
      error: "Upload failed.",
    });
    expect(mocks.deleteObject).toHaveBeenCalledWith(
      "documents/user-1/generated-report.txt"
    );
  });
});
