-- CreateTable
CREATE TABLE "SubmitAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SubmitAttempt_ip_createdAt_idx" ON "SubmitAttempt"("ip", "createdAt");
