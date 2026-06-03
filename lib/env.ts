import { z } from "zod";

const postgresUrlSchema = z
  .string()
  .min(1, "DATABASE_URL is required")
  .refine(
    (value) =>
      value.startsWith("postgresql://") || value.startsWith("postgres://"),
    "DATABASE_URL must be a PostgreSQL connection string"
  );

const booleanStringSchema = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const optionalUrlSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional()
);

export const envSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: optionalUrlSchema,
  S3_ENDPOINT: z.string().url("S3_ENDPOINT must be a valid URL"),
  S3_REGION: z.string().min(1, "S3_REGION is required"),
  S3_BUCKET: z.string().min(1, "S3_BUCKET is required"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required"),
  S3_FORCE_PATH_STYLE: booleanStringSchema,
  S3_PUBLIC_BASE_URL: optionalUrlSchema,
});

const databaseEnvSchema = envSchema.pick({
  DATABASE_URL: true,
});

export type AppEnv = z.infer<typeof envSchema>;

function formatEnvError(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
}

export function parseEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${formatEnvError(parsed.error)}`
    );
  }

  return parsed.data;
}

export function getDatabaseUrl(source: NodeJS.ProcessEnv = process.env) {
  const parsed = databaseEnvSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error(
      `Invalid database configuration: ${formatEnvError(parsed.error)}`
    );
  }

  return parsed.data.DATABASE_URL;
}
