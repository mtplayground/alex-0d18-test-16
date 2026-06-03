export const uploadPurposes = ["avatar", "document"] as const;

export type UploadPurpose = (typeof uploadPurposes)[number];

export const uploadLimits: Record<UploadPurpose, number> = {
  avatar: 2 * 1024 * 1024,
  document: 10 * 1024 * 1024,
};

export const allowedUploadContentTypes: Record<
  UploadPurpose,
  readonly string[]
> = {
  avatar: ["image/jpeg", "image/png", "image/webp"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
};

export const uploadAccept: Record<UploadPurpose, string> = {
  avatar: allowedUploadContentTypes.avatar.join(","),
  document: [
    ...allowedUploadContentTypes.document,
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
  ].join(","),
};

export function isUploadPurpose(value: unknown): value is UploadPurpose {
  return (
    typeof value === "string" && uploadPurposes.includes(value as UploadPurpose)
  );
}

export function isAllowedUploadContentType(
  purpose: UploadPurpose,
  contentType: string
) {
  return allowedUploadContentTypes[purpose].includes(contentType);
}

export function getUploadLimitMegabytes(purpose: UploadPurpose) {
  return Math.floor(uploadLimits[purpose] / 1024 / 1024);
}
