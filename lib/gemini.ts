import { execFile } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { MAX_DURATION_SEC, MIN_DURATION_SEC } from "@/lib/constants";
import type { AiAnalysisResult } from "@/lib/types";
import { logApiUsage } from "@/lib/usage";

const execFileAsync = promisify(execFile);

const DEFAULT_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

function getModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim();
  const fallbacks =
    process.env.GEMINI_MODEL_FALLBACKS?.split(",")
      .map((m) => m.trim())
      .filter(Boolean) ?? DEFAULT_MODELS;

  return [...new Set([...(primary ? [primary] : []), ...fallbacks])];
}

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("429") ||
    msg.toLowerCase().includes("quota") ||
    msg.includes("Too Many Requests")
  );
}

function parseRetryDelayMs(error: unknown): number {
  const msg = error instanceof Error ? error.message : String(error);
  const match = msg.match(/retry in ([\d.]+)s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 1000;
  return 60_000;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPrompt(nama: string, npm: string, kelas: string): string {
  return `Anda adalah asisten penilaian UAS mata kuliah Internet of Things.

Analisis video presentasi mahasiswa berikut sesuai rubrik UAS.

Data mahasiswa (untuk verifikasi di video):
- Nama: ${nama}
- NPM: ${npm}
- Kelas: ${kelas}

Ketentuan video:
- Durasi valid: ${MIN_DURATION_SEC / 60}–${MAX_DURATION_SEC / 60} menit
- Wajah mahasiswa harus terlihat jelas
- Bukan AI avatar / text-to-speech

Rubrik 4 bagian (tandai passed true/false + catatan singkat Bahasa Indonesia):
1. perkenalan — nama, NPM, kelas disebutkan
2. refleksi_dan_feedback — refleksi perkuliahan (materi menarik/menantang/bermanfaat, praktikum, manfaat) dan feedback dosen (cara mengajar, kejelasan, interaksi, saran)
3. gagasan_inovasi — ide inovasi IoT orisinal (BUKAN project tugas besar saat ini), nama inovasi, permasalahan, cara kerja, sensor, manfaat; semakin inovatif semakin baik
4. penutup — kesimpulan dan harapan IoT

Juga deteksi:
- faceDetected: wajah mahasiswa terlihat
- possibleTtsOrAvatar: indikasi AI avatar/TTS (flag saja)
- durationSeconds & durationValid jika bisa diperkirakan dari video
- overallScore: 0–100 kepatuhan rubrik
- summary: ringkasan 2–3 kalimat untuk dosen

Jawab HANYA JSON valid dengan struktur:
{
  "faceDetected": boolean,
  "durationSeconds": number | null,
  "durationValid": boolean | null,
  "sections": {
    "perkenalan": { "passed": boolean, "note": string },
    "refleksi_dan_feedback": { "passed": boolean, "note": string },
    "gagasan_inovasi": { "passed": boolean, "note": string },
    "penutup": { "passed": boolean, "note": string }
  },
  "possibleTtsOrAvatar": boolean,
  "overallScore": number,
  "summary": string
}`;
}

export async function analyzeVideoWithGemini(
  youtubeUrl: string,
  meta: { nama: string; npm: string; kelas: string },
  submissionId?: string,
): Promise<AiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi");
  }

  const prompt = buildPrompt(meta.nama, meta.npm, meta.kelas);
  const preferYtDlp = process.env.GEMINI_USE_YT_DLP === "true";

  if (!preferYtDlp) {
    try {
      return await analyzeWithContent(
        apiKey,
        [
          {
            fileData: {
              mimeType: "video/mp4",
              fileUri: youtubeUrl,
            },
          },
          { text: prompt },
        ],
        submissionId,
      );
    } catch (error) {
      if (isQuotaError(error)) throw error;
      console.warn(
        "[Gemini] Analisis via URL YouTube langsung gagal, fallback yt-dlp:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "uas-iot-"));
  const tempVideo = path.join(tempDir, "video.mp4");

  try {
    await downloadVideo(youtubeUrl, tempVideo);

    const fileManager = new GoogleAIFileManager(apiKey);
    const upload = await fileManager.uploadFile(tempVideo, {
      mimeType: "video/mp4",
      displayName: `uas-${meta.npm}`,
    });

    let file = await fileManager.getFile(upload.file.name);
    while (file.state === "PROCESSING") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(upload.file.name);
    }

    if (file.state === "FAILED") {
      throw new Error("Gemini gagal memproses file video");
    }

    return await analyzeWithContent(
      apiKey,
      [
        {
          fileData: {
            mimeType: upload.file.mimeType,
            fileUri: upload.file.uri,
          },
        },
        { text: prompt },
      ],
      submissionId,
      async () => {
        try {
          await fileManager.deleteFile(upload.file.name);
        } catch {
          // ignore cleanup errors
        }
      },
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

type GeminiContent = Parameters<
  ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]
>[0];

async function analyzeWithContent(
  apiKey: string,
  content: GeminiContent,
  submissionId?: string,
  onSuccess?: () => Promise<void>,
): Promise<AiAnalysisResult> {
  const models = getModelCandidates();
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const { text, usage, model } = await generateContentWithRetry(
        apiKey,
        modelName,
        content,
      );
      const parsed = JSON.parse(text) as AiAnalysisResult;

      await logApiUsage({
        service: "gemini",
        operation: "analyze_video",
        model,
        promptTokens: usage?.promptTokenCount,
        outputTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount,
        success: true,
        submissionId,
      });

      await onSuccess?.();
      return parsed;
    } catch (error) {
      lastError = error;
      if (isQuotaError(error)) {
        await logApiUsage({
          service: "gemini",
          operation: "analyze_video",
          model: modelName,
          success: false,
          errorMessage:
            error instanceof Error ? error.message.slice(0, 500) : "Quota exceeded",
          submissionId,
        });
        console.warn(`[Gemini] Kuota habis untuk model ${modelName}, coba model lain...`);
        continue;
      }
      await logApiUsage({
        service: "gemini",
        operation: "analyze_video",
        model: modelName,
        success: false,
        errorMessage:
          error instanceof Error ? error.message.slice(0, 500) : "Analisis gagal",
        submissionId,
      });
      throw error;
    }
  }

  const quotaError = formatQuotaError(lastError);
  await logApiUsage({
    service: "gemini",
    operation: "analyze_video",
    model: models[models.length - 1],
    success: false,
    errorMessage: quotaError.message.slice(0, 500),
    submissionId,
  });
  throw quotaError;
}

async function generateContentWithRetry(
  apiKey: string,
  modelName: string,
  content: Parameters<
    ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["generateContent"]
  >[0],
  maxAttempts = 3,
): Promise<{
  text: string;
  model: string;
  usage?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json" },
  });

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(content);
      return {
        text: result.response.text(),
        model: modelName,
        usage: result.response.usageMetadata,
      };
    } catch (error) {
      lastError = error;
      if (isQuotaError(error) && attempt < maxAttempts - 1) {
        const delay = parseRetryDelayMs(error);
        console.warn(
          `[Gemini] 429 pada ${modelName}, retry ${attempt + 1}/${maxAttempts} dalam ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

function formatQuotaError(error: unknown): Error {
  const base =
    error instanceof Error ? error.message : "Kuota Gemini API habis";
  return new Error(
    `${base}\n\nSaran: tunggu beberapa menit, ganti GEMINI_MODEL di .env (mis. gemini-2.5-flash), atau aktifkan billing di Google AI Studio.`,
  );
}

const YOUTUBE_PLAYER_CLIENTS = [
  "android_vr,web",
  "mweb,web",
  "tv_embedded,web",
  "ios,web",
  "android,web",
];

function getYtDlpCookieArgs(): string[] {
  const cookiesPath = process.env.YT_DLP_COOKIES_PATH?.trim();
  if (cookiesPath) {
    return ["--cookies", cookiesPath];
  }

  const fromBrowser = process.env.YT_DLP_COOKIES_FROM_BROWSER?.trim();
  if (fromBrowser) {
    return ["--cookies-from-browser", fromBrowser];
  }

  return [];
}

function isYoutubeBotBlockError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("sign in to confirm") ||
    lower.includes("not a bot") ||
    lower.includes("cookies-from-browser") ||
    lower.includes("confirm you're not a bot")
  );
}

async function downloadVideo(youtubeUrl: string, outputPath: string) {
  const ytdlp = process.env.YT_DLP_PATH ?? "yt-dlp";
  const cookieArgs = getYtDlpCookieArgs();
  const errors: string[] = [];

  for (const clients of YOUTUBE_PLAYER_CLIENTS) {
    const args = [
      "--no-playlist",
      "--no-warnings",
      ...cookieArgs,
      "--extractor-args",
      `youtube:player_client=${clients}`,
      "-f",
      "worst[height<=360][ext=mp4]/worst[height<=360]/worst/best[height<=360]",
      "-o",
      outputPath,
      youtubeUrl,
    ];

    try {
      await execFileAsync(ytdlp, args, {
        timeout: 180000,
        maxBuffer: 5 * 1024 * 1024,
      });
      await fs.access(outputPath);
      return;
    } catch (error) {
      const err = error as NodeJS.ErrnoException & {
        stderr?: string;
        stdout?: string;
      };

      if (err.code === "ENOENT") {
        throw new Error(
          "yt-dlp tidak ditemukan di PATH server. Install yt-dlp atau set YT_DLP_PATH=/usr/local/bin/yt-dlp di .env",
        );
      }

      const detail = [err.stderr, err.stdout, err.message]
        .filter(Boolean)
        .join(" ")
        .trim();
      errors.push(detail || "Unduhan gagal tanpa detail");

      await fs.rm(outputPath, { force: true }).catch(() => {});
    }
  }

  const lastError = errors[errors.length - 1] ?? "Unduhan gagal";
  if (isYoutubeBotBlockError(lastError)) {
    throw new Error(
      "Gagal mengunduh video YouTube: YouTube memblokir IP server (bot check). " +
        "Secara default aplikasi sekarang menganalisis via URL YouTube langsung ke Gemini; " +
        "deploy ulang jika server masih memakai versi lama. " +
        "Jika fallback yt-dlp tetap diperlukan, set YT_DLP_COOKIES_PATH ke file cookies.txt " +
        "(export dari browser yang login YouTube). " +
        "Panduan: https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies",
    );
  }

  throw new Error(
    `Gagal mengunduh video YouTube: ${lastError.slice(0, 400)}`,
  );
}

export function parseAiResult(json: string | null): AiAnalysisResult | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AiAnalysisResult;
  } catch {
    return null;
  }
}
