import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseAiResult } from "@/lib/gemini";
import { isAdminAuthorized } from "@/lib/admin-auth";
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const submission = await prisma.submission.findUnique({ where: { id } });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission tidak ditemukan" },
      { status: 404 },
    );
  }

  return NextResponse.json({ submission: toPublic(submission) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const submission = await prisma.submission.findUnique({ where: { id } });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission tidak ditemukan" },
      { status: 404 },
    );
  }

  await prisma.submission.delete({ where: { id } });

  return NextResponse.json({ message: "Submission berhasil dihapus" });
}
