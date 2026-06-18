import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KELAS_OPTIONS } from "@/lib/constants";
import { parseAiResult } from "@/lib/gemini";
import type { SubmissionPublic } from "@/lib/types";

function toPublic(submission: {
  id: string;
  kelas: string;
  nama: string;
  npm: string;
  youtubeUrl: string;
  youtubeId: string;
  duration: number | null;
  durationValid: boolean;
  aiStatus: string;
  aiScore: number | null;
  aiResult: string | null;
  aiError: string | null;
  createdAt: Date;
}): SubmissionPublic {
  return {
    id: submission.id,
    kelas: submission.kelas,
    nama: submission.nama,
    npm: submission.npm,
    youtubeUrl: submission.youtubeUrl,
    youtubeId: submission.youtubeId,
    duration: submission.duration,
    durationValid: submission.durationValid,
    aiStatus: submission.aiStatus,
    aiScore: submission.aiScore,
    aiResult: parseAiResult(submission.aiResult),
    aiError: submission.aiError,
    createdAt: submission.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const kelas = request.nextUrl.searchParams.get("kelas");

  const where =
    kelas && KELAS_OPTIONS.includes(kelas as (typeof KELAS_OPTIONS)[number])
      ? { kelas }
      : {};

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    submissions: submissions.map(toPublic),
  });
}
