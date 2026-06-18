import { AI_SECTION_LABELS } from "@/lib/labels";
import { formatDuration } from "@/lib/format";
import type { SubmissionPublic } from "@/lib/types";

interface AiAnalysisContentProps {
  submission: SubmissionPublic;
  compact?: boolean;
  showScore?: boolean;
}

export function AiAnalysisContent({
  submission,
  compact = false,
  showScore = false,
}: AiAnalysisContentProps) {
  const ai = submission.aiResult;

  if (!ai) {
    if (
      submission.aiStatus === "pending" ||
      submission.aiStatus === "processing"
    ) {
      return (
        <div
          className={`rounded-xl border border-amber-200 bg-amber-50 text-amber-800 ${
            compact ? "p-3 text-xs" : "p-6 text-center"
          }`}
        >
          <p className="font-medium">
            {submission.aiStatus === "processing"
              ? "Analisis AI sedang diproses..."
              : "Menunggu analisis AI"}
          </p>
        </div>
      );
    }

    if (submission.aiStatus === "skipped" && !compact) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
          Analisis AI tidak dijalankan (GEMINI_API_KEY belum dikonfigurasi).
        </div>
      );
    }

    return null;
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {showScore && submission.aiScore !== null && (
        <div className="flex justify-end">
          <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-blue-700 text-white">
            <span className="text-2xl font-bold leading-none">
              {submission.aiScore}
            </span>
            <span className="text-[10px] opacity-80">skor AI</span>
          </div>
        </div>
      )}

      <div
        className={`grid gap-2 ${
          compact ? "grid-cols-2" : "gap-4 sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        <InfoCard
          compact={compact}
          label="Wajah terdeteksi"
          value={ai.faceDetected ? "Ya" : "Tidak"}
          ok={ai.faceDetected}
        />
        <InfoCard
          compact={compact}
          label="Durasi (AI)"
          value={
            ai.durationSeconds != null
              ? formatDuration(ai.durationSeconds)
              : "—"
          }
          ok={ai.durationValid ?? submission.durationValid}
        />
        <InfoCard
          compact={compact}
          label="Durasi valid"
          value={
            ai.durationValid != null
              ? ai.durationValid
                ? "Ya"
                : "Tidak"
              : submission.durationValid
                ? "Ya"
                : "Tidak"
          }
          ok={ai.durationValid ?? submission.durationValid}
        />
        <InfoCard
          compact={compact}
          label="TTS/Avatar"
          value={ai.possibleTtsOrAvatar ? "Perlu review" : "Aman"}
          ok={!ai.possibleTtsOrAvatar}
        />
      </div>

      {ai.summary && (
        <div
          className={`rounded-xl border border-slate-200 bg-slate-50 ${
            compact ? "p-3" : "rounded-2xl bg-white p-6 shadow-sm"
          }`}
        >
          <h4
            className={`font-semibold text-slate-900 ${
              compact ? "text-xs" : "text-base"
            }`}
          >
            Ringkasan Analisis
          </h4>
          <p
            className={`mt-2 leading-relaxed text-slate-600 ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {ai.summary}
          </p>
        </div>
      )}

      {ai.sections && (
        <div
          className={`rounded-xl border border-slate-200 ${
            compact ? "p-3" : "rounded-2xl bg-white p-6 shadow-sm"
          }`}
        >
          <h4
            className={`font-semibold text-slate-900 ${
              compact ? "text-xs" : "text-base"
            }`}
          >
            Checklist Rubrik UAS
          </h4>
          <div className={`mt-2 space-y-2 ${compact ? "" : "mt-4 space-y-3"}`}>
            {Object.entries(ai.sections).map(([key, section]) => (
              <div
                key={key}
                className={`rounded-lg border ${
                  compact ? "p-2.5" : "rounded-xl p-4"
                } ${
                  section.passed
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-red-200 bg-red-50/50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${
                      compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"
                    } ${section.passed ? "bg-emerald-500" : "bg-red-500"}`}
                  >
                    {section.passed ? "✓" : "✗"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-medium text-slate-900 ${
                        compact ? "text-xs" : "text-sm"
                      }`}
                    >
                      {compact
                        ? (AI_SECTION_LABELS[key]?.split("—")[0]?.trim() ??
                          key)
                        : (AI_SECTION_LABELS[key] ?? key)}
                    </p>
                    {section.note && (
                      <p
                        className={`mt-1 text-slate-600 ${
                          compact ? "text-[11px] leading-snug" : "text-sm"
                        }`}
                      >
                        {section.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  ok,
  compact,
}: {
  label: string;
  value: string;
  ok: boolean;
  compact: boolean;
}) {
  return (
    <div
      className={`rounded-lg border ${
        compact ? "p-2" : "rounded-xl p-4"
      } ${
        ok
          ? "border-emerald-200 bg-emerald-50/60"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`font-medium uppercase tracking-wide text-slate-500 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-0.5 font-semibold ${
          compact ? "text-xs" : "text-lg"
        } ${ok ? "text-emerald-800" : "text-slate-800"}`}
      >
        {value}
      </p>
    </div>
  );
}
