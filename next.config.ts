import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modules — jangan di-bundle webpack
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
  ],
  // Pastikan file Prisma ikut production trace
  outputFileTracingIncludes: {
    "/api/**/*": ["./generated/prisma/**/*"],
  },
};

export default nextConfig;
