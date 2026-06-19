#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";

function getModuleDirectory() {
  return __dirname;
}

function findProjectRootFrom(startDir) {
  let dir = path.resolve(startDir);

  while (true) {
    const hasPackage = fs.existsSync(path.join(dir, "package.json"));
    const hasPrisma = fs.existsSync(path.join(dir, "prisma", "schema.prisma"));
    if (hasPackage && hasPrisma) {
      return dir;
    }

    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

function getProjectRoot() {
  if (process.env.PROJECT_ROOT) {
    return path.resolve(process.env.PROJECT_ROOT);
  }

  for (const start of [process.cwd(), getModuleDirectory()]) {
    const root = findProjectRootFrom(start);
    if (root) {
      return root;
    }
  }

  return process.cwd();
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

function getSqliteFilePath() {
  return resolveSqliteDatabaseUrl().replace(/^file:/, "");
}

const REQUIRED_TABLES = ["Submission", "SubmitAttempt", "ApiUsageLog"];

const diagnostics = {
  projectRoot: getProjectRoot(),
  cwd: process.cwd(),
  databaseUrlEnv: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  resolvedDatabasePath: getSqliteFilePath(),
  databaseExists: fs.existsSync(getSqliteFilePath()),
};

console.log("=== UAS IoT Database Status ===");
console.log(JSON.stringify(diagnostics, null, 2));

if (!diagnostics.databaseExists) {
  console.error("\nDatabase file belum ada. Jalankan: npm run db:deploy");
  process.exit(1);
}

const db = new Database(diagnostics.resolvedDatabasePath, { readonly: true });
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
  .all()
  .map((row) => row.name);
const missing = REQUIRED_TABLES.filter((table) => !tables.includes(table));

console.log("\nTables:", tables.join(", ") || "(kosong)");

if (missing.length > 0) {
  console.error("\nTabel belum ada:", missing.join(", "));
  console.error("Jalankan di folder proyek:");
  console.error(`  cd ${diagnostics.projectRoot}`);
  console.error("  npm run db:deploy");
  process.exit(1);
}

console.log("\nOK — database siap.");
db.close();
