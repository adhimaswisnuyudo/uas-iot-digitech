import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AI_STATUS } from "@/lib/constants";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { runSubmissionAnalysis } from "@/lib/run-submission-analysis";

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

  await runSubmissionAnalysis(id);

  const updated = await prisma.submission.findUnique({ where: { id } });
  if (updated?.aiStatus === AI_STATUS.FAILED) {
    return NextResponse.json(
      { error: updated.aiError ?? "Analisis AI gagal" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Analisis selesai" });
}
