export function getSubmitErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const combined = message.toLowerCase();

  if (
    combined.includes("no such table") ||
    combined.includes("submitattempt") ||
    combined.includes("apiusagelog")
  ) {
    return "Database belum siap. Admin server: jalankan npm run db:deploy.";
  }

  if (
    combined.includes("sqlite_cantopen") ||
    combined.includes("unable to open database") ||
    combined.includes("eacces") ||
    combined.includes("permission denied")
  ) {
    return "Database tidak bisa ditulis. Admin server: chmod 755 prisma && chmod 664 prisma/dev.db";
  }

  if (
    combined.includes("better_sqlite3") ||
    combined.includes("better-sqlite3") ||
    combined.includes("invalid or unexpected token") ||
    combined.includes("was compiled against a different node.js version")
  ) {
    return "Modul database gagal dimuat. Admin server: rm -rf node_modules && npm ci";
  }

  if (process.env.NODE_ENV !== "production" && message) {
    return message;
  }

  return "Terjadi kesalahan saat menyimpan data";
}
