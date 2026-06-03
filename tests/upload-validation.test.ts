import { describe, expect, it } from "vitest";

import {
  getUploadLimitMegabytes,
  isAllowedUploadContentType,
  isUploadPurpose,
  uploadAccept,
  uploadLimits,
} from "@/lib/upload-validation";

describe("upload validation helpers", () => {
  it("recognizes supported upload purposes", () => {
    expect(isUploadPurpose("avatar")).toBe(true);
    expect(isUploadPurpose("document")).toBe(true);
    expect(isUploadPurpose("video")).toBe(false);
    expect(isUploadPurpose(undefined)).toBe(false);
  });

  it("allows only purpose-specific content types", () => {
    expect(isAllowedUploadContentType("avatar", "image/png")).toBe(true);
    expect(isAllowedUploadContentType("avatar", "application/pdf")).toBe(false);
    expect(isAllowedUploadContentType("document", "application/pdf")).toBe(
      true
    );
    expect(isAllowedUploadContentType("document", "image/png")).toBe(false);
  });

  it("exposes stable limits and accept strings for upload UI", () => {
    expect(uploadLimits.avatar).toBe(2 * 1024 * 1024);
    expect(uploadLimits.document).toBe(10 * 1024 * 1024);
    expect(getUploadLimitMegabytes("avatar")).toBe(2);
    expect(getUploadLimitMegabytes("document")).toBe(10);
    expect(uploadAccept.avatar).toContain("image/png");
    expect(uploadAccept.document).toContain(".pdf");
  });
});
