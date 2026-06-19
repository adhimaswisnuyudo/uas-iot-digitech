import { prisma } from "@/lib/db";

const SETTINGS_ID = "default";

function appSettingClient() {
  if (!("appSetting" in prisma)) {
    throw new Error(
      "Prisma client belum memuat model AppSetting. Jalankan: npx prisma generate && npm run db:deploy, lalu restart server.",
    );
  }

  return prisma.appSetting;
}

export async function getAppSettings() {
  return appSettingClient().upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, autoAnalyzeVideos: true },
    update: {},
  });
}

export async function setAutoAnalyzeVideos(enabled: boolean) {
  return appSettingClient().upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, autoAnalyzeVideos: enabled },
    update: { autoAnalyzeVideos: enabled },
  });
}
