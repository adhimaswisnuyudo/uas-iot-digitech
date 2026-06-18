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

Rubrik 5 bagian (tandai passed true/false + catatan singkat Bahasa Indonesia):
1. perkenalan — nama, NPM, kelas disebutkan
2. pemahaman_iot — apa itu IoT, komponen utama, cara kerja
3. refleksi_dan_feedback — refleksi perkuliahan (materi menarik/menantang/bermanfaat, praktikum, manfaat) dan feedback dosen (cara mengajar, kejelasan, interaksi, saran)
4. gagasan_inovasi — nama inovasi, permasalahan, cara kerja, sensor, manfaat
5. penutup — kesimpulan dan harapan IoT

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
    "pemahaman_iot": { "passed": boolean, "note": string },
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

    const content = [
      {
        fileData: {
          mimeType: upload.file.mimeType,
          fileUri: upload.file.uri,
        },
      },
      { text: buildPrompt(meta.nama, meta.npm, meta.kelas) },
    ];

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

        try {
          await fileManager.deleteFile(upload.file.name);
        } catch {
          // ignore cleanup errors
        }

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
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
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

async function downloadVideo(youtubeUrl: string, outputPath: string) {
  try {
    await execFileAsync(
      "yt-dlp",
      [
        "-f",
        "worst[height<=360][ext=mp4]/worst[height<=360]/worst",
        "--no-playlist",
        "-o",
        outputPath,
        youtubeUrl,
      ],
      { timeout: 120000 },
    );
  } catch {
    throw new Error(
      "Gagal mengunduh video. Pastikan yt-dlp terinstall di server.",
    );
  }

  try {
    await fs.access(outputPath);
  } catch {
    throw new Error("File video tidak ditemukan setelah unduhan");
  }
}

export function parseAiResult(json: string | null): AiAnalysisResult | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as AiAnalysisResult;
  } catch {
    return null;
  }
}
