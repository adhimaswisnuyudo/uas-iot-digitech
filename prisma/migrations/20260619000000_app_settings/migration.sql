-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "autoAnalyzeVideos" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- Insert default settings
INSERT INTO "AppSetting" ("id", "autoAnalyzeVideos", "updatedAt")
VALUES ('default', true, CURRENT_TIMESTAMP);
