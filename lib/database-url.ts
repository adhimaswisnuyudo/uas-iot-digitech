import fs from "fs";
import path from "path";

const DEFAULT_DATABASE_URL = "file:./prisma/dev.db";

export function resolveSqliteDatabaseUrl(
  rawUrl = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
): string {
  if (!rawUrl.startsWith("file:")) {
    return rawUrl;
  }

  const filePath = rawUrl.slice("file:".length);
  const resolved = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  fs.mkdirSync(path.dirname(resolved), { recursive: true });

  return `file:${resolved}`;
}
