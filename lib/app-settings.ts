import { prisma } from "@/lib/db";

const SETTINGS_ID = "default";

export async function getAppSettings() {
  return prisma.appSetting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, autoAnalyzeVideos: true },
    update: {},
  });
}

export async function setAutoAnalyzeVideos(enabled: boolean) {
  return prisma.appSetting.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, autoAnalyzeVideos: enabled },
    update: { autoAnalyzeVideos: enabled },
  });
}
