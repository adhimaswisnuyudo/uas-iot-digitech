export function getSubmitErrorMessage(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (!message.trim()) {
    return "Terjadi kesalahan saat menyimpan data";
  }

  return message.replace(/\s+/g, " ").trim().slice(0, 300);
}
