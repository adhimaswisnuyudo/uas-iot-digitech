import { prisma } from "@/lib/db";
import {
  getDatabaseDiagnostics,
  getSqliteFilePath,
} from "@/lib/database-url";

const REQUIRED_TABLES = ["Submission", "SubmitAttempt", "ApiUsageLog"] as const;

export async function checkDatabaseHealth() {
  const diagnostics = getDatabaseDiagnostics();
  const dbPath = getSqliteFilePath();

  try {
    const rows = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
    `;
    const tables = rows.map((row) => row.name);
    const missing = REQUIRED_TABLES.filter((table) => !tables.includes(table));

    return {
      ok: missing.length === 0,
      ...diagnostics,
      tables,
      missing,
      dbPath,
    };
  } catch (error) {
    return {
      ok: false,
      ...diagnostics,
      tables: [] as string[],
      missing: [...REQUIRED_TABLES],
      dbPath,
      error: error instanceof Error ? error.message : "Gagal membaca database",
    };
  }
}
