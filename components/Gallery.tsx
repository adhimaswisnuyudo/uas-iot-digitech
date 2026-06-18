"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { VideoCard } from "@/components/VideoCard";
import { KELAS_OPTIONS } from "@/lib/constants";
import type { SubmissionPublic } from "@/lib/types";

export function Gallery() {
  const [submissions, setSubmissions] = useState<SubmissionPublic[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      const data = (await res.json()) as { submissions: SubmissionPublic[] };
      setSubmissions(data.submissions);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSubmissions();
  }, [fetchSubmissions]);

  const counts = useMemo(() => {
    return KELAS_OPTIONS.reduce(
      (acc, kelas) => {
        acc[kelas] = submissions.filter((s) => s.kelas === kelas).length;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [submissions]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return submissions.filter((s) => {
      const matchKelas = !filter || s.kelas === filter;
      const matchSearch =
        !query ||
        s.nama.toLowerCase().includes(query) ||
        s.npm.toLowerCase().includes(query);
      return matchKelas && matchSearch;
    });
  }, [submissions, filter, search]);

  const isEmpty = submissions.length === 0;
  const noResults = !isEmpty && filtered.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterBar
          selected={filter}
          onChange={setFilter}
          counts={counts}
          total={submissions.length}
        />
        <div className="relative w-full sm:max-w-xs">
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

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : noResults ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-slate-700">
            Tidak ada hasil pencarian
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Coba kata kunci lain atau reset filter kelas.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-slate-700">
            Belum ada submission
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Jadilah yang pertama mengumpulkan UAS video IoT.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((submission) => (
            <VideoCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}
