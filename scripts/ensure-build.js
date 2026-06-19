const fs = require("fs");
const path = require("path");

const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");

if (fs.existsSync(buildIdPath)) {
  process.exit(0);
}

console.error("");
console.error("Production build belum ada (.next/BUILD_ID tidak ditemukan).");
console.error("");
console.error("Jalankan di folder proyek:");
console.error("  npm run build");
console.error("");
console.error("Lalu start ulang:");
console.error("  pm2 restart uasdigitech");
console.error("");
process.exit(1);
