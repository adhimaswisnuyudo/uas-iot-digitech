import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const MIN_FORM_AGE_MS = 3_000;
const MAX_FORM_AGE_MS = 60 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function getSecret() {
  return (
    process.env.ANTIBOT_SECRET ??
    process.env.ADMIN_PASSWORD ??
    "uas-iot-dev-antibot-secret"
  );
}

export function createSubmitChallenge() {
  const issuedAt = Date.now();
  const signature = createHmac("sha256", getSecret())
    .update(String(issuedAt))
    .digest("hex");
  return {
    token: `${issuedAt}.${signature}`,
    issuedAt,
  };
}

function verifySubmitToken(token: string): boolean {
  const [issuedAtRaw, signature] = token.split(".");
  if (!issuedAtRaw || !signature) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;

  const age = Date.now() - issuedAt;
  if (age < MIN_FORM_AGE_MS || age > MAX_FORM_AGE_MS) return false;

  const expected = createHmac("sha256", getSecret())
    .update(issuedAtRaw)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function recordSubmitAttempt(ip: string) {
  await prisma.submitAttempt.create({ data: { ip } });
}

export async function isRateLimited(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const count = await prisma.submitAttempt.count({
    where: { ip, createdAt: { gte: since } },
  });
  return count >= RATE_LIMIT_MAX;
}

export interface AntibotPayload {
  token?: string;
  honeypot?: string;
}

export async function validateAntibot(
  request: NextRequest,
  payload: AntibotPayload,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const ip = getClientIp(request);

  if (payload.honeypot?.trim()) {
    await recordSubmitAttempt(ip);
    return { ok: false, error: "Permintaan ditolak.", status: 403 };
  }

  if (!payload.token || !verifySubmitToken(payload.token)) {
    await recordSubmitAttempt(ip);
    return {
      ok: false,
      error: "Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.",
      status: 403,
    };
  }

  if (await isRateLimited(ip)) {
    return {
      ok: false,
      error: "Terlalu banyak percobaan. Coba lagi dalam 1 jam.",
      status: 429,
    };
  }

  await recordSubmitAttempt(ip);
  return { ok: true };
}
