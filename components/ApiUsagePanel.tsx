"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { ApiUsageStats } from "@/lib/usage-types";

function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID");
}

function UsageBlock({
  title,
  configured,
  today,
  total,
  lastCall,
  extra,
}: {
  title: string;
  configured: boolean;
  today: ApiUsageStats["gemini"]["today"];
  total: ApiUsageStats["gemini"]["total"];
  lastCall: string | null;
  extra?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {configured ? "API key terkonfigurasi" : "API key belum diisi"}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            configured
              ? "bg-emerald-100 text-emerald-800"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {configured ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {extra}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Request hari ini" value={formatNumber(today.requests)} />
        <Stat label="Token hari ini" value={formatNumber(today.totalTokens)} />
        <Stat label="Gagal hari ini" value={formatNumber(today.failed)} />
        <Stat label="Total request" value={formatNumber(total.requests)} />
        <Stat label="Total token" value={formatNumber(total.totalTokens)} />
        <Stat label="Total gagal" value={formatNumber(total.failed)} />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Panggilan terakhir: {formatDate(lastCall)}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function ApiUsagePanel() {
  const [stats, setStats] = useState<ApiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsage = useCallback(async () => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/usage", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as ApiUsageStats & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal memuat usage API");
        return;
      }
      setStats(data);
    } catch {
      setError("Gagal memuat usage API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsage();
  }, [fetchUsage]);

  if (loading) {
    return (
      <div className="mt-6 h-40 animate-pulse rounded-2xl bg-slate-200" />
    );
  }

  if (error || !stats) {
    return (
      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Data usage tidak tersedia"}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Penggunaan API</h2>
          <p className="text-xs text-slate-500">{stats.note}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void fetchUsage()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
          <a
            href={stats.rateLimitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100"
          >
            Kuota resmi Google →
          </a>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UsageBlock
          title="Gemini API"
          configured={stats.gemini.configured}
          today={stats.gemini.today}
          total={stats.gemini.total}
          lastCall={stats.gemini.lastCall}
          extra={
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                Model: {stats.gemini.model}
              </span>
              {stats.gemini.lastModel && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                  Terakhir: {stats.gemini.lastModel}
                </span>
              )}
            </div>
          }
        />
        <UsageBlock
          title="YouTube Data API"
          configured={stats.youtube.configured}
          today={stats.youtube.today}
          total={stats.youtube.total}
          lastCall={stats.youtube.lastCall}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Status Analisis Submission</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            Total: {stats.submissions.total}
          </span>
          {Object.entries(stats.submissions.byStatus).map(([status, count]) => (
            <span
              key={status}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
            >
              {status}: {count}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
