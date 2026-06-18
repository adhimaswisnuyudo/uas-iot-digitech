import {
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
} from "@/lib/constants";
import { formatDuration } from "@/lib/format";

const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  const match = trimmed.match(YOUTUBE_ID_REGEX);
  return match?.[1] ?? null;
}

export function normalizeYoutubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function isDurationValid(durationSec: number): boolean {
  return durationSec >= MIN_DURATION_SEC && durationSec <= MAX_DURATION_SEC;
}

export { formatDuration } from "@/lib/format";

export async function validateYoutubeVideo(url: string): Promise<{
  videoId: string;
  title?: string;
  duration?: number;
  durationValid: boolean;
  embeddable: boolean;
  error?: string;
}> {
  const videoId = extractYoutubeId(url);
  if (!videoId) {
    return {
      videoId: "",
      durationValid: false,
      embeddable: false,
      error: "URL YouTube tidak valid",
    };
  }

  let title: string | undefined;
  let embeddable = true;

  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { next: { revalidate: 0 } },
    );

    if (!oembedRes.ok) {
      return {
        videoId,
        durationValid: false,
        embeddable: false,
        error: "Video tidak ditemukan atau tidak dapat diakses (public/unlisted)",
      };
    }

    const oembed = (await oembedRes.json()) as { title?: string };
    title = oembed.title;
  } catch {
    return {
      videoId,
      durationValid: false,
      embeddable: false,
      error: "Gagal memverifikasi video YouTube",
    };
  }

  const duration = await fetchYoutubeDuration(videoId);
  const durationValid =
    duration !== undefined ? isDurationValid(duration) : false;

  return {
    videoId,
    title,
    duration,
    durationValid,
    embeddable,
    error:
      duration !== undefined && !durationValid
        ? `Durasi video harus ${MIN_DURATION_SEC / 60}–${MAX_DURATION_SEC / 60} menit (saat ini ${formatDuration(duration)})`
        : undefined,
  };
}

async function fetchYoutubeDuration(
  videoId: string,
): Promise<number | undefined> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`,
        { next: { revalidate: 0 } },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          items?: Array<{ contentDetails?: { duration?: string } }>;
        };
        const iso = data.items?.[0]?.contentDetails?.duration;
        if (iso) return parseIso8601Duration(iso);
      }
    } catch {
      // fallback below
    }
  }

  return fetchDurationFromPage(videoId);
}

function parseIso8601Duration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

async function fetchDurationFromPage(
  videoId: string,
): Promise<number | undefined> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return undefined;

    const html = await res.text();
    const match =
      html.match(/"lengthSeconds":"(\d+)"/) ??
      html.match(/"approxDurationMs":"(\d+)"/);

    if (!match) return undefined;

    if (match[0].includes("approxDurationMs")) {
      return Math.round(parseInt(match[1], 10) / 1000);
    }
    return parseInt(match[1], 10);
  } catch {
    return undefined;
  }
}
