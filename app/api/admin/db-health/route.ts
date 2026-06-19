import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { checkDatabaseHealth } from "@/lib/db-health";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const health = await checkDatabaseHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
