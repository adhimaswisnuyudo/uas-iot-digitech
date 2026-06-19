const fs = require("fs");
const path = require("path");

const root = process.cwd();
const npmLock = path.join(root, "package-lock.json");

if (!fs.existsSync(npmLock)) {
  console.error(
    "[ensure-npm] package-lock.json tidak ditemukan. Jalankan npm install di repo ini.",
  );
  process.exit(1);
}

for (const lockFile of ["yarn.lock", "pnpm-lock.yaml"]) {
  const lockPath = path.join(root, lockFile);
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.warn(`[ensure-npm] Menghapus ${lockFile} — proyek ini memakai npm.`);
  }
}
