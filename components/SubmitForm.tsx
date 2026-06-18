"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KELAS_OPTIONS } from "@/lib/constants";

const MIN_SUBMIT_DELAY_MS = 3_000;

export function SubmitForm() {
  const router = useRouter();
  const [kelas, setKelas] = useState("");
  const [nama, setNama] = useState("");
  const [npm, setNpm] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [token, setToken] = useState("");
  const [readyAt, setReadyAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [canSubmit, setCanSubmit] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    let timer: number | undefined;

    async function loadChallenge() {
      try {
        const res = await fetch("/api/submit/challenge");
        const data = (await res.json()) as { token?: string; issuedAt?: number };
        if (data.token) {
          setToken(data.token);
          const unlockAt = (data.issuedAt ?? Date.now()) + MIN_SUBMIT_DELAY_MS;
          setReadyAt(unlockAt);
          const delay = Math.max(0, unlockAt - Date.now());
          timer = window.setTimeout(() => setCanSubmit(true), delay);
        }
      } catch {
        setError("Gagal memuat verifikasi keamanan. Muat ulang halaman.");
      }
    }

    void loadChallenge();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (canSubmit) return;
    const interval = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(interval);
  }, [canSubmit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !token) {
      setError("Tunggu sebentar sebelum mengirim form.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelas,
          nama,
          npm,
          youtubeUrl,
          token,
          honeypot,
        }),
      });

      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? "Gagal mengirim submission");
        return;
      }

      setSuccess(data.message ?? "Berhasil!");
      setTimeout(() => router.push("/"), 2000);
    } catch {
      setError("Koneksi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const secondsLeft =
    readyAt && !canSubmit
      ? Math.ceil(Math.max(0, readyAt - Date.now()) / 1000)
      : 0;

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0"
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="kelas" className="mb-1.5 block text-sm font-medium text-slate-700">
          Kelas
        </label>
        <select
          id="kelas"
          value={kelas}
          onChange={(e) => setKelas(e.target.value)}
          required
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
        >
          <option value="">Pilih kelas</option>
          {KELAS_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="nama" className="mb-1.5 block text-sm font-medium text-slate-700">
          Nama Lengkap
        </label>
        <input
          id="nama"
          type="text"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          required
          placeholder="Contoh: Adi Nugraha"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
        />
      </div>

      <div>
        <label htmlFor="npm" className="mb-1.5 block text-sm font-medium text-slate-700">
          NPM
        </label>
        <input
          id="npm"
          type="text"
          value={npm}
          onChange={(e) => setNpm(e.target.value)}
          required
          placeholder="23110001"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
        />
      </div>

      <div>
        <label htmlFor="youtubeUrl" className="mb-1.5 block text-sm font-medium text-slate-700">
          URL Video YouTube
        </label>
        <input
          id="youtubeUrl"
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          required
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
        />
        <p className="mt-2 text-xs text-slate-500">
          Video public/unlisted · durasi 2–5 menit · wajah terlihat jelas · tanpa AI avatar/TTS
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !canSubmit || !token}
        className="w-full rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-semibold text-white hover:bg-blue-800 transition-colors disabled:opacity-60"
      >
        {loading
          ? "Mengirim..."
          : !canSubmit
            ? `Tunggu ${secondsLeft || 3} detik...`
            : "Kumpulkan UAS"}
      </button>
    </form>
  );
}
