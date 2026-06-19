import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { getAppSettings, setAutoAnalyzeVideos } from "@/lib/app-settings";

export async function GET(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getAppSettings();
  return NextResponse.json({
    autoAnalyzeVideos: settings.autoAnalyzeVideos,
    updatedAt: settings.updatedAt.toISOString(),
  });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { autoAnalyzeVideos?: boolean };

  if (typeof body.autoAnalyzeVideos !== "boolean") {
    return NextResponse.json(
      { error: "Field autoAnalyzeVideos wajib berupa boolean" },
      { status: 400 },
    );
  }

  const settings = await setAutoAnalyzeVideos(body.autoAnalyzeVideos);
  return NextResponse.json({
    autoAnalyzeVideos: settings.autoAnalyzeVideos,
    updatedAt: settings.updatedAt.toISOString(),
  });
}
