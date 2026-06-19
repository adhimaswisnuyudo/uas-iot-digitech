import { prisma } from "@/lib/db";
import { AI_STATUS } from "@/lib/constants";
import { analyzeVideoWithGemini } from "@/lib/gemini";

export async function runSubmissionAnalysis(id: string): Promise<void> {
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return;

  if (!process.env.GEMINI_API_KEY) return;

  if (submission.aiStatus === AI_STATUS.PROCESSING) return;

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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analisis AI gagal";
    await prisma.submission.update({
      where: { id },
      data: { aiStatus: AI_STATUS.FAILED, aiError: message },
    });
  }
}
