"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { AiAnalysisDetail } from "@/components/AiAnalysisDetail";
import type { SubmissionPublic } from "@/lib/types";

export default function AdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [submission, setSubmission] = useState<SubmissionPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${id}`);
      if (res.status === 404) {
        setSubmission(null);
        return;
      }
      const data = (await res.json()) as { submission: SubmissionPublic };
      setSubmission(data.submission);
    } catch {
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }
    void fetchSubmission();
  }, [fetchSubmission, router]);

  async function reanalyze() {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      router.replace("/admin");
      return;
    }

    setReanalyzing(true);
    try {
      const res = await fetch(`/api/submissions/${id}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? "Gagal menjalankan analisis AI");
      }
      await fetchSubmission();
    } finally {
      setReanalyzing(false);
    }
  }

  async function deleteSubmission() {
    const token = sessionStorage.getItem("admin_token");
    if (!token || !submission) {
      router.replace("/admin");
      return;
    }

    if (
      !confirm(
        `Hapus submission "${submission.nama}"?\n\nData akan dihapus permanen dan tidak bisa dikembalikan.`,
      )
    ) {
      return;
    }

    setDeleting(true);
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
      router.push("/admin");
    } finally {
      setDeleting(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    router.replace("/admin");
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Link
            href="/admin"
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            ← Kembali ke dashboard admin
          </Link>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Detail Analisis AI
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Hasil analisis Gemini secara keseluruhan
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Keluar
              </button>
            {submission && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={reanalyze}
                  disabled={
                    reanalyzing ||
                    deleting ||
                    submission.aiStatus === "processing"
                  }
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {reanalyzing
                    ? "Memproses..."
                    : submission.aiStatus === "done"
                      ? "Analisis ulang"
                      : "Analisis AI"}
                </button>
                <button
                  type="button"
                  onClick={deleteSubmission}
                  disabled={deleting || reanalyzing}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {deleting ? "Menghapus..." : "Hapus Data"}
                </button>
              </div>
            )}
            </div>
          </div>

          {loading ? (
            <div className="mt-8 h-64 animate-pulse rounded-2xl bg-slate-200" />
          ) : !submission ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-slate-600">Submission tidak ditemukan</p>
            </div>
          ) : (
            <div className="mt-8">
              <AiAnalysisDetail submission={submission} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
