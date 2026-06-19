import { AI_STATUS } from "@/lib/constants";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  [AI_STATUS.PENDING]: {
    label: "Belum dianalisis",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  [AI_STATUS.PROCESSING]: {
    label: "Sedang dianalisis",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  [AI_STATUS.DONE]: {
    label: "Analisis selesai",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  [AI_STATUS.FAILED]: {
    label: "Analisis gagal",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  [AI_STATUS.SKIPPED]: {
    label: "AI nonaktif",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[AI_STATUS.PENDING];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function DurationBadge({
  duration,
  valid,
}: {
  duration: number | null;
  valid: boolean;
}) {
  if (duration === null) {
    return (
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600">
        Durasi belum diketahui
      </span>
    );
  }

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const label = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        valid
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {valid ? "✓" : "✗"} {label}
    </span>
  );
}
