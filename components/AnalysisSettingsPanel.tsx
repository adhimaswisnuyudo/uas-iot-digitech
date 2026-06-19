"use client";

import { useCallback, useEffect, useState } from "react";

export function AnalysisSettingsPanel() {
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchSettings = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        autoAnalyzeVideos?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat pengaturan");
        return;
      }
      setAutoAnalyze(data.autoAnalyzeVideos ?? true);
    } catch {
      setError("Gagal memuat pengaturan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  async function handleToggle(enabled: boolean) {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ autoAnalyzeVideos: enabled }),
      });
      const data = (await res.json()) as {
        autoAnalyzeVideos?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan pengaturan");
        return;
      }
      setAutoAnalyze(data.autoAnalyzeVideos ?? enabled);
    } catch {
      setError("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-6 h-28 animate-pulse rounded-2xl bg-slate-200" />
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Mode Analisis Video
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tentukan apakah video dianalisis otomatis saat diupload mahasiswa,
            atau manual oleh admin.
          </p>
        </div>

        <div className="flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleToggle(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
              autoAnalyze
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Otomatis
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleToggle(false)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
              !autoAnalyze
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {autoAnalyze ? (
          <>
            <span className="font-medium text-slate-900">Mode otomatis aktif.</span>{" "}
            Video akan langsung dianalisis Gemini setelah mahasiswa submit.
          </>
        ) : (
          <>
            <span className="font-medium text-slate-900">Mode manual aktif.</span>{" "}
            Video masuk gallery tanpa analisis. Klik &quot;Analisis AI&quot; per
            mahasiswa untuk menjalankannya.
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
