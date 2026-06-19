import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AI_STATUS } from "@/lib/constants";
import { analyzeVideoWithGemini } from "@/lib/gemini";
import { isAdminAuthorized } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const submission = await prisma.submission.findUnique({ where: { id } });

  if (!submission) {
    return NextResponse.json({ error: "Submission tidak ditemukan" }, { status: 404 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum dikonfigurasi" },
      { status: 503 },
    );
  }

  if (submission.aiStatus === AI_STATUS.PROCESSING) {
    return NextResponse.json(
      { error: "Analisis sedang berjalan" },
      { status: 409 },
    );
  }

  await prisma.submission.update({
    where: { id },
    data: { aiStatus: AI_STATUS.PROCESSING, aiError: null },
  });

  try {
    const result = await analyzeVideoWithGemini(
      submission.youtubeUrl,
      {
        nama: submission.nama,
        npm: submission.npm,
        kelas: submission.kelas,
      },
      id,
    );

    const durationFromAi = result.durationSeconds;
    const durationValid =
      durationFromAi !== undefined
        ? durationFromAi >= 120 && durationFromAi <= 300
        : submission.durationValid;

    await prisma.submission.update({
      where: { id },
      data: {
        aiStatus: AI_STATUS.DONE,
        aiScore: Math.round(result.overallScore),
        aiResult: JSON.stringify(result),
        duration: durationFromAi ?? submission.duration,
        durationValid,
      },
    });

    return NextResponse.json({ message: "Analisis selesai" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analisis AI gagal";
    await prisma.submission.update({
      where: { id },
      data: { aiStatus: AI_STATUS.FAILED, aiError: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
