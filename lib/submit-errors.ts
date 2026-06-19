function getErrorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "";
}

function isNativeModuleLoadError(message: string): boolean {
  const combined = message.toLowerCase();
  return (
    combined.includes("could not locate the bindings file") ||
    combined.includes("node_module_version") ||
    combined.includes("was compiled against a different node.js version") ||
    combined.includes("invalid elf header") ||
    combined.includes("module did not self-register")
  );
}

export function getSubmitErrorMessage(error: unknown): string {
  const message = getErrorText(error);

  if (!message) {
    return "Terjadi kesalahan saat menyimpan data";
  }

  const combined = message.toLowerCase();

  if (combined.includes("no such table")) {
    return "Database belum dimigrasi. Admin server: npm run db:deploy";
  }

  if (
    combined.includes("readonly") ||
    combined.includes("read-only") ||
    combined.includes("sqlite_readonly")
  ) {
    return "Database tidak bisa ditulis. Admin server: chown -R www:www prisma && chmod 664 prisma/dev.db";
  }

  if (
    combined.includes("sqlite_cantopen") ||
    combined.includes("unable to open database") ||
    combined.includes("eacces") ||
    combined.includes("permission denied")
  ) {
    return "Database tidak bisa diakses. Admin server: periksa permission folder prisma/";
  }

  if (isNativeModuleLoadError(message)) {
    return "Modul database native gagal dimuat. Admin server: npm rebuild better-sqlite3 && pm2 restart uasdigitech";
  }

  const preview = message.replace(/\s+/g, " ").slice(0, 180);
  return `Terjadi kesalahan saat menyimpan data: ${preview}`;
}
