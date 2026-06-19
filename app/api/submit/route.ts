import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KELAS_OPTIONS, AI_STATUS } from "@/lib/constants";
import {
  normalizeYoutubeUrl,
  validateYoutubeVideo,
} from "@/lib/youtube";
import { logApiUsage } from "@/lib/usage";
import { validateAntibot } from "@/lib/antibot";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      kelas?: string;
      nama?: string;
      npm?: string;
      youtubeUrl?: string;
      token?: string;
      honeypot?: string;
    };

    const antibot = await validateAntibot(request, {
      token: body.token,
      honeypot: body.honeypot,
    });
    if (!antibot.ok) {
      return NextResponse.json(
        { error: antibot.error },
        { status: antibot.status },
      );
    }

    const kelas = body.kelas?.trim();
    const nama = body.nama?.trim();
    const npm = body.npm?.trim();
    const youtubeUrl = body.youtubeUrl?.trim();

    if (!kelas || !KELAS_OPTIONS.includes(kelas as (typeof KELAS_OPTIONS)[number])) {
      return NextResponse.json(
        { error: "Pilih kelas yang valid (C123, C223, atau A23)" },
        { status: 400 },
      );
    }

    if (!nama || nama.length < 3) {
      return NextResponse.json(
        { error: "Nama lengkap wajib diisi" },
        { status: 400 },
      );
    }

    if (!npm || npm.length < 1) {
      return NextResponse.json(
        { error: "NPM wajib diisi" },
        { status: 400 },
      );
    }

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "URL YouTube wajib diisi" },
        { status: 400 },
      );
    }

    const existing = await prisma.submission.findUnique({ where: { npm } });
    if (existing) {
      return NextResponse.json(
        { error: "NPM sudah terdaftar. Hubungi dosen jika perlu submit ulang." },
        { status: 409 },
      );
    }

    const validation = await validateYoutubeVideo(youtubeUrl);

    if (process.env.YOUTUBE_API_KEY) {
      await logApiUsage({
        service: "youtube",
        operation: "videos.list",
        success: validation.duration !== undefined,
        errorMessage:
          validation.duration === undefined ? "Durasi tidak ditemukan via API" : undefined,
      });
    }

    if (!validation.embeddable) {
      return NextResponse.json(
        { error: validation.error ?? "Video YouTube tidak valid" },
        { status: 400 },
      );
    }

    if (validation.duration !== undefined && !validation.durationValid) {
      return NextResponse.json(
        { error: validation.error ?? "Durasi video tidak memenuhi ketentuan" },
        { status: 400 },
      );
    }

    const submission = await prisma.submission.create({
      data: {
        kelas,
        nama,
        npm,
        youtubeUrl: normalizeYoutubeUrl(validation.videoId),
        youtubeId: validation.videoId,
        duration: validation.duration ?? null,
        durationValid: validation.durationValid,
        aiStatus: process.env.GEMINI_API_KEY
          ? AI_STATUS.PENDING
          : AI_STATUS.SKIPPED,
      },
    });

    return NextResponse.json(
      {
        message: "Submission berhasil! Video Anda sudah masuk gallery.",
        id: submission.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan data" },
      { status: 500 },
    );
  }
}
