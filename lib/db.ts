import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import { resolveSqliteDatabaseUrl } from "@/lib/database-url";

const connectionString = resolveSqliteDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaLibSql({ url: connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && "appSetting" in cached) {
    return cached;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;

  if (!cached) {
    console.info(`[db] Using SQLite at ${connectionString}`);
  } else {
    console.info("[db] Prisma client di-refresh (model baru terdeteksi)");
  }

  return client;
}

export const prisma = getPrismaClient();
