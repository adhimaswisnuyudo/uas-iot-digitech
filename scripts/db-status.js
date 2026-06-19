#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");

const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";

function getProjectRoot() {
  if (process.env.PROJECT_ROOT) {
    return path.resolve(process.env.PROJECT_ROOT);
  }

  let dir = process.cwd();
  while (true) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "prisma", "schema.prisma"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return process.cwd();
    }
    dir = parent;
  }
}

function resolveSqliteDatabaseUrl(rawUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL) {
  if (!rawUrl.startsWith("file:")) {
    return rawUrl;
  }

  const filePath = rawUrl.slice("file:".length);
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(getProjectRoot(), filePath);

  return `file:${resolved}`;
}

const REQUIRED_TABLES = ["Submission", "SubmitAttempt", "ApiUsageLog"];

async function main() {
  const url = resolveSqliteDatabaseUrl();
  const dbPath = url.replace(/^file:/, "");
  const diagnostics = {
    projectRoot: getProjectRoot(),
    cwd: process.cwd(),
    databaseUrlEnv: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    resolvedDatabasePath: dbPath,
    databaseExists: fs.existsSync(dbPath),
  };

  console.log("=== UAS IoT Database Status ===");
  console.log(JSON.stringify(diagnostics, null, 2));

  if (!diagnostics.databaseExists) {
    console.error("\nDatabase file belum ada. Jalankan: npm run db:deploy");
    process.exit(1);
  }

  const client = createClient({ url });

  const tablesResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
  );
  const tables = tablesResult.rows.map((row) => String(row.name));
  const missing = REQUIRED_TABLES.filter((table) => !tables.includes(table));

  console.log("\nTables:", tables.join(", ") || "(kosong)");

  if (missing.length > 0) {
    console.error("\nTabel belum ada:", missing.join(", "));
    console.error("Jalankan: npm run db:deploy");
    process.exit(1);
  }

  const testId = `db-status-${Date.now()}`;
  try {
    await client.execute({
      sql: "INSERT INTO SubmitAttempt (id, ip) VALUES (?, ?)",
      args: [testId, "db-status-test"],
    });
    await client.execute({
      sql: "DELETE FROM SubmitAttempt WHERE id = ?",
      args: [testId],
    });
    console.log("\nWrite test: OK");
  } catch (error) {
    console.error(
      "\nWrite test GAGAL:",
      error instanceof Error ? error.message : error,
    );
    console.error("\nPerbaiki permission (sesuaikan user PM2, biasanya www):");
    console.error(`  chown -R www:www ${path.dirname(dbPath)}`);
    console.error(`  chmod 775 ${path.dirname(dbPath)}`);
    console.error(`  chmod 664 ${dbPath}`);
    process.exit(1);
  } finally {
    client.close();
  }

  console.log("\nOK — database siap.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
