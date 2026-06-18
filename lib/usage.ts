import { prisma } from "@/lib/db";

export interface LogUsageInput {
  service: "gemini" | "youtube";
  operation: string;
  model?: string;
  promptTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  success?: boolean;
  errorMessage?: string;
  submissionId?: string;
}

export async function logApiUsage(input: LogUsageInput) {
  try {
    await prisma.apiUsageLog.create({
      data: {
        service: input.service,
        operation: input.operation,
        model: input.model ?? null,
        promptTokens: input.promptTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        totalTokens: input.totalTokens ?? null,
        success: input.success ?? true,
        errorMessage: input.errorMessage ?? null,
        submissionId: input.submissionId ?? null,
      },
    });
  } catch (error) {
    console.error("[usage] Gagal mencatat log API:", error);
  }
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function aggregateUsage(service: string, since?: Date) {
  const where = since ? { service, createdAt: { gte: since } } : { service };

  const [total, success, failed, tokenSum] = await Promise.all([
    prisma.apiUsageLog.count({ where }),
    prisma.apiUsageLog.count({ where: { ...where, success: true } }),
    prisma.apiUsageLog.count({ where: { ...where, success: false } }),
    prisma.apiUsageLog.aggregate({
      where,
      _sum: {
        promptTokens: true,
        outputTokens: true,
        totalTokens: true,
      },
    }),
  ]);

  return {
    requests: total,
    success,
    failed,
    promptTokens: tokenSum._sum.promptTokens ?? 0,
    outputTokens: tokenSum._sum.outputTokens ?? 0,
    totalTokens: tokenSum._sum.totalTokens ?? 0,
  };
}

export async function getApiUsageStats() {
  const todayStart = startOfToday();

  const [
    geminiToday,
    geminiTotal,
    youtubeToday,
    youtubeTotal,
    lastGemini,
    lastYoutube,
    submissionCounts,
  ] = await Promise.all([
    aggregateUsage("gemini", todayStart),
    aggregateUsage("gemini"),
    aggregateUsage("youtube", todayStart),
    aggregateUsage("youtube"),
    prisma.apiUsageLog.findFirst({
      where: { service: "gemini" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.apiUsageLog.findFirst({
      where: { service: "youtube" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.groupBy({
      by: ["aiStatus"],
      _count: { _all: true },
    }),
  ]);

  const aiStatusCounts = Object.fromEntries(
    submissionCounts.map((row) => [row.aiStatus, row._count._all]),
  );

  return {
    gemini: {
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      today: geminiToday,
      total: geminiTotal,
      lastCall: lastGemini?.createdAt.toISOString() ?? null,
      lastModel: lastGemini?.model ?? null,
    },
    youtube: {
      configured: Boolean(process.env.YOUTUBE_API_KEY),
      today: youtubeToday,
      total: youtubeTotal,
      lastCall: lastYoutube?.createdAt.toISOString() ?? null,
    },
    submissions: {
      total: submissionCounts.reduce((sum, row) => sum + row._count._all, 0),
      byStatus: aiStatusCounts,
    },
    dashboardUrl: "https://aistudio.google.com/",
    rateLimitUrl: "https://ai.dev/rate-limit",
    note: "Angka di bawah dicatat oleh aplikasi. Kuota resmi Google AI Studio lihat di link di atas.",
  };
}
