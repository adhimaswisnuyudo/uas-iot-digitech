import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./generated/prisma/**/*"],
  },
};

export default nextConfig;
