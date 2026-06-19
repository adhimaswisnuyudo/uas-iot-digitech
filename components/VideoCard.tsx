"use client";

import { useState } from "react";
import { DurationBadge } from "@/components/Badge";
import { AiAnalysisContent } from "@/components/AiAnalysisContent";
import { Modal } from "@/components/Modal";
import { formatDateTime } from "@/lib/format";
import type { SubmissionPublic } from "@/lib/types";

export function VideoCard({ submission }: { submission: SubmissionPublic }) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const hasAnalysis = submission.aiResult !== null;

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg hover:border-blue-200">
        <div className="relative aspect-video bg-slate-900">
          <iframe
            src={`https://www.youtube.com/embed/${submission.youtubeId}`}
            title={`Video UAS ${submission.nama}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <h3 className="font-semibold text-slate-900">{submission.nama}</h3>
            <p className="text-sm text-slate-500">
              {submission.npm} · {submission.kelas}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Dikumpulkan {formatDateTime(submission.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <DurationBadge
              duration={submission.duration}
              valid={submission.durationValid}
            />
            {hasAnalysis && submission.aiResult?.faceDetected && (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700">
                Wajah terdeteksi
              </span>
            )}
          </div>

          {hasAnalysis && (
            <>
              {submission.aiResult?.summary && (
                <p className="line-clamp-2 text-xs text-slate-600">
                  {submission.aiResult.summary}
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowAnalysis(true)}
                className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-100"
              >
                Lihat Hasil Analisis
              </button>
            </>
          )}

          <a
            href={submission.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            Buka di YouTube →
          </a>
        </div>
      </article>

      <Modal
        open={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        title={`Analisis — ${submission.nama}`}
      >
        <div className="mb-4 text-sm text-slate-500">
          {submission.npm} · {submission.kelas}
          <span className="mx-1.5">·</span>
          Dikumpulkan {formatDateTime(submission.createdAt)}
        </div>
        <AiAnalysisContent submission={submission} />
      </Modal>
    </>
  );
}
