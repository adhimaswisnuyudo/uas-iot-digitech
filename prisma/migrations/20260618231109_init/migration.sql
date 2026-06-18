-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kelas" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "npm" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "duration" INTEGER,
    "durationValid" BOOLEAN NOT NULL DEFAULT false,
    "aiStatus" TEXT NOT NULL DEFAULT 'pending',
    "aiScore" INTEGER,
    "aiResult" TEXT,
    "aiError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_npm_key" ON "Submission"("npm");
