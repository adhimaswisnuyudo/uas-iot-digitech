const fs = require("fs");
const path = require("path");

const clientPath = path.join(
  process.cwd(),
  "generated",
  "prisma",
  "client.ts",
);

if (fs.existsSync(clientPath)) {
  process.exit(0);
}

console.error("");
console.error("Prisma Client belum di-generate (generated/prisma/client.ts tidak ada).");
console.error("Jalankan: npx prisma generate");
console.error("");
process.exit(1);
