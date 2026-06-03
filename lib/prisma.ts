import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { getDatabaseUrl } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientSingleton;
};

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryableDatabaseError(error: unknown) {
  const message =
    error instanceof Error ? error.message : String(error ?? "unknown error");

  return [
    "Connection terminated unexpectedly",
    "Connection terminated",
    "ECONNRESET",
    "08006",
    "57P01",
  ].some((retryableMessage) => message.includes(retryableMessage));
}

async function withDatabaseRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableDatabaseError(error) || attempt === 2) {
        break;
      }

      await wait(200 * (attempt + 1));
    }
  }

  throw lastError;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return withDatabaseRetry(() => query(args));
        },
      },
    },
  });
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
