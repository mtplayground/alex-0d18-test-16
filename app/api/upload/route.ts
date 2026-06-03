import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteObject, uploadObject } from "@/lib/storage";
import {
  getUploadLimitMegabytes,
  isAllowedUploadContentType,
  isUploadPurpose,
  type UploadPurpose,
  uploadLimits,
} from "@/lib/upload-validation";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status,
    }
  );
}

function sanitizeFileName(fileName: string) {
  const sanitized = fileName
    .trim()
    .replace(/[/\\]/g, "-")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-");

  return sanitized || "upload";
}

function getStorageKey(
  purpose: UploadPurpose,
  userId: string,
  fileName: string
) {
  return `${purpose}s/${userId}/${randomUUID()}-${sanitizeFileName(fileName)}`;
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return jsonError("Authentication is required.", 401);
  }

  const formData = await request.formData();
  const purpose = formData.get("purpose");
  const file = formData.get("file");

  if (!isUploadPurpose(purpose)) {
    return jsonError("Upload purpose must be avatar or document.", 400);
  }

  if (!(file instanceof File)) {
    return jsonError("A file is required.", 400);
  }

  if (file.size <= 0) {
    return jsonError("File must not be empty.", 400);
  }

  if (file.size > uploadLimits[purpose]) {
    return jsonError(
      `File exceeds the ${getUploadLimitMegabytes(purpose)} MB limit.`,
      400
    );
  }

  if (!isAllowedUploadContentType(purpose, file.type)) {
    return jsonError("File type is not allowed for this upload purpose.", 400);
  }

  const storageKey = getStorageKey(purpose, userId, file.name);
  let uploadedKey: string | undefined;

  try {
    const upload = await uploadObject({
      key: storageKey,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
      contentLength: file.size,
      metadata: {
        originalFileName: file.name,
        purpose,
        userId,
      },
    });
    uploadedKey = upload.key;

    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        storageKey: upload.key,
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

    return NextResponse.json(
      {
        attachment: {
          ...attachment,
          purpose,
          url: upload.url,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (uploadedKey) {
      await deleteObject(uploadedKey).catch(() => undefined);
    }

    console.error("File upload failed", error);
    return jsonError("Upload failed.", 500);
  }
}
