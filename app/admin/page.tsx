"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { DurationBadge, StatusBadge } from "@/components/Badge";
import { ApiUsagePanel } from "@/components/ApiUsagePanel";
import { FilterBar } from "@/components/FilterBar";
import { downloadSubmissionsExcel } from "@/lib/export-submissions";
import { KELAS_OPTIONS } from "@/lib/constants";
import type { SubmissionPublic } from "@/lib/types";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionPublic[]>([]);
  const [loading, setLoading] = useState(false);
  const [reanalyzing, setReanalyzing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterKelas, setFilterKelas] = useState("");
  const [search, setSearch] = useState("");

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      const data = (await res.json()) as { submissions: SubmissionPublic[] };
      setSubmissions(data.submissions);
    } catch {
      alert("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_token");
    if (saved) {
      setPassword(saved);
      setAuthenticated(true);
      void fetchSubmissions();
    }
  }, [fetchSubmissions]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? "Password salah");
        return;
      }
      sessionStorage.setItem("admin_token", password);
      setAuthenticated(true);
      await fetchSubmissions();
    } catch {
      alert("Gagal login");
    } finally {
      setLoading(false);
    }
  }

  async function reanalyze(id: string) {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    setReanalyzing(id);
    try {
      const res = await fetch(`/api/submissions/${id}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? "Gagal menjalankan analisis AI");
      }
      await fetchSubmissions();
    } finally {
      setReanalyzing(null);
    }
  }

  function analyzeButtonLabel(status: string, id: string) {
    if (reanalyzing === id) return "Memproses...";
    if (status === "done") return "Analisis ulang";
    return "Analisis AI";
  }

  async function deleteSubmission(id: string, nama: string) {
    const token = sessionStorage.getItem("admin_token");
    if (!token) return;

    if (
      !confirm(
        `Hapus submission "${nama}"?\n\nData akan dihapus permanen dari gallery dan tidak bisa dikembalikan.`,
      )
    ) {
      return;
    }

    setDeleting(id);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? "Gagal menghapus data");
        return;
      }
      await fetchSubmissions();
    } finally {
      setDeleting(null);
    }
  }

  async function exportExcel() {
    if (filteredSubmissions.length === 0) {
      alert("Belum ada data untuk diexport");
      return;
    }
    await downloadSubmissionsExcel(filteredSubmissions);
  }

  const counts = useMemo(() => {
    return KELAS_OPTIONS.reduce(
      (acc, kelas) => {
        acc[kelas] = submissions.filter((s) => s.kelas === kelas).length;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return submissions.filter((s) => {
      const matchKelas = !filterKelas || s.kelas === filterKelas;
      const matchSearch =
        !query ||
        s.nama.toLowerCase().includes(query) ||
        s.npm.toLowerCase().includes(query);
      return matchKelas && matchSearch;
    });
  }, [submissions, filterKelas, search]);

  const isEmpty = submissions.length === 0;
  const noResults = !isEmpty && filteredSubmissions.length === 0;

  return (
    <>
      <Header />
      <main className="flex-1 bg-slate-50">
        {!authenticated ? (
          <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center px-4 py-10">
            <div className="w-full max-w-sm">
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-slate-900">
                  Dashboard Admin
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Masuk untuk kelola submission UAS
                </p>
              </div>
              <form
                onSubmit={handleLogin}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Password Admin
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {loading ? "Memproses..." : "Masuk"}
                </button>
              </form>
            </div>
          </div>
        ) : (
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola submission dan analisis AI Gemini
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void exportExcel()}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Export Excel
                </button>
                <Link
                  href="/"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Lihat Gallery
                </Link>
              </div>

              <ApiUsagePanel />

              {loading ? (
                <p className="mt-8 text-slate-500">Memuat...</p>
              ) : isEmpty ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                  <p className="text-slate-600">Belum ada submission</p>
                </div>
              ) : (
                <>
                  <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <FilterBar
                      selected={filterKelas}
                      onChange={setFilterKelas}
                      counts={counts}
                      total={submissions.length}
                    />
                    <div className="relative w-full lg:max-w-xs">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nama atau NPM..."
                        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
                      />
                    </div>
                  </div>

                  {noResults ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                      <p className="text-slate-600">Tidak ada hasil pencarian</p>
                    </div>
                  ) : (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="w-12 px-4 py-3 font-medium">No</th>
                        <th className="px-4 py-3 font-medium">Mahasiswa</th>
                        <th className="px-4 py-3 font-medium">Kelas</th>
                        <th className="px-4 py-3 font-medium">Durasi</th>
                        <th className="px-4 py-3 font-medium">AI</th>
                        <th className="px-4 py-3 font-medium">Skor</th>
                        <th className="px-4 py-3 font-medium">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissions.map((s, index) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">
                              {s.nama}
                            </p>
                            <p className="text-xs text-slate-500">{s.npm}</p>
                          </td>
                          <td className="px-4 py-3">{s.kelas}</td>
                          <td className="px-4 py-3">
                            <DurationBadge
                              duration={s.duration}
                              valid={s.durationValid}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={s.aiStatus} />
                            {s.aiError && (
                              <p className="mt-1 max-w-xs text-xs text-red-600">
                                {s.aiError}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {s.aiScore ?? "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/admin/${s.id}`}
                                className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800"
                              >
                                Detail
                              </Link>
                              <button
                                type="button"
                                onClick={() => reanalyze(s.id)}
                                disabled={
                                  reanalyzing === s.id ||
                                  s.aiStatus === "processing"
                                }
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                              >
                                {analyzeButtonLabel(s.aiStatus, s.id)}
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteSubmission(s.id, s.nama)}
                                disabled={deleting === s.id}
                                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                {deleting === s.id ? "Menghapus..." : "Hapus"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  )}
                </>
              )}
        </div>
        )}
      </main>
    </>
  );
}
