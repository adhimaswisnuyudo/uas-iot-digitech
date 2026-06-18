import { DurationBadge, StatusBadge } from "@/components/Badge";
import { AiAnalysisContent } from "@/components/AiAnalysisContent";
import type { SubmissionPublic } from "@/lib/types";

export function AiAnalysisDetail({
  submission,
}: {
  submission: SubmissionPublic;
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative aspect-video bg-slate-900">
          <iframe
            src={`https://www.youtube.com/embed/${submission.youtubeId}`}
            title={`Video UAS ${submission.nama}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {submission.nama}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                NPM {submission.npm} · Kelas {submission.kelas}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Dikumpulkan{" "}
                {new Date(submission.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status={submission.aiStatus} />
            <DurationBadge
              duration={submission.duration}
              valid={submission.durationValid}
            />
          </div>

          <a
            href={submission.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            Buka di YouTube →
          </a>
        </div>
      </div>

      {submission.aiError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-800">Error Analisis AI</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-red-700">
            {submission.aiError}
          </p>
        </div>
      )}

      <AiAnalysisContent submission={submission} showScore />
    </div>
  );
}
