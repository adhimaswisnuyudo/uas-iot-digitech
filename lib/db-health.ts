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

    let writeOk = true;
    let writeError: string | undefined;
    const testId = `health-${Date.now()}`;
    try {
      await prisma.submitAttempt.create({ data: { id: testId, ip: "health-check" } });
      await prisma.submitAttempt.delete({ where: { id: testId } });
    } catch (error) {
      writeOk = false;
      writeError =
        error instanceof Error ? error.message : "Gagal menulis via Prisma";
    }

    return {
      ok: missing.length === 0 && writeOk,
      ...diagnostics,
      tables,
      missing,
      dbPath,
      prismaWriteOk: writeOk,
      prismaWriteError: writeError,
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
