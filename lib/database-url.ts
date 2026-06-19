import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";

function getModuleDirectory(): string {
  if (typeof __dirname !== "undefined") {
    return __dirname;
  }
  return path.dirname(fileURLToPath(import.meta.url));
}

function findProjectRootFrom(startDir: string): string | null {
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

export function getProjectRoot(): string {
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

export function resolveSqliteDatabaseUrl(
  rawUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
): string {
  if (!rawUrl.startsWith("file:")) {
    return rawUrl;
  }

  const filePath = rawUrl.slice("file:".length);
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(getProjectRoot(), filePath);

  fs.mkdirSync(path.dirname(resolved), { recursive: true });

  return `file:${resolved}`;
}

export function getSqliteFilePath(
  rawUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
): string {
  return resolveSqliteDatabaseUrl(rawUrl).replace(/^file:/, "");
}

export function getDatabaseDiagnostics() {
  return {
    projectRoot: getProjectRoot(),
    cwd: process.cwd(),
    databaseUrlEnv: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    resolvedDatabasePath: getSqliteFilePath(),
    databaseExists: fs.existsSync(getSqliteFilePath()),
  };
}
