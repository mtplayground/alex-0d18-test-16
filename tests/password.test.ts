import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("hashes and verifies a matching password", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");

    expect(passwordHash).not.toBe("correct horse battery staple");
    await expect(
      verifyPassword("correct horse battery staple", passwordHash)
    ).resolves.toBe(true);
  });

  it("rejects invalid passwords and malformed hashes", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");

    await expect(verifyPassword("wrong password", passwordHash)).resolves.toBe(
      false
    );
    await expect(verifyPassword("anything", "not-a-bcrypt-hash")).resolves.toBe(
      false
    );
  });
});
