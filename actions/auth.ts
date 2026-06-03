"use server";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(80, "Display name must be 80 characters or less"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(254, "Email must be 254 characters or less")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or less"),
});

type SignUpField = "displayName" | "email" | "password";

export type SignUpState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<SignUpField, string>>;
};

function toFieldErrors(error: z.ZodError): SignUpState["fieldErrors"] {
  const fieldErrors: SignUpState["fieldErrors"] = {};
  const fields = new Set<SignUpField>(["displayName", "email", "password"]);

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && fields.has(field as SignUpField)) {
      const signUpField = field as SignUpField;
      fieldErrors[signUpField] ??= issue.message;
    }
  }

  return fieldErrors;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function signUpAction(
  _previousState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "An account already exists for that email.",
      fieldErrors: {
        email: "An account already exists for that email.",
      },
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await prisma.user.create({
      data: {
        displayName: parsed.data.displayName,
        email: parsed.data.email,
        passwordHash,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        status: "error",
        message: "An account already exists for that email.",
        fieldErrors: {
          email: "An account already exists for that email.",
        },
      };
    }

    throw error;
  }

  return {
    status: "success",
    message: "Account created.",
  };
}
