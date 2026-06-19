import { AI_SECTION_LABELS } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import type { SubmissionPublic } from "@/lib/types";

export const EXPORT_RUBRIC_KEYS = [
  "perkenalan",
  "refleksi_dan_feedback",
  "gagasan_inovasi",
  "penutup",
] as const;

function rubricExportLabel(key: (typeof EXPORT_RUBRIC_KEYS)[number]): string {
  const full = AI_SECTION_LABELS[key] ?? key;
  const short = full.split("—")[1]?.trim();
  return short ?? full;
}

function checklistValue(passed: boolean | undefined): string {
  if (passed === undefined) return "";
  return passed ? "Ya" : "Tidak";
}

function getRubricPassed(
  sections: Record<string, { passed: boolean }> | undefined,
  key: (typeof EXPORT_RUBRIC_KEYS)[number],
): boolean | undefined {
  if (!sections) return undefined;

  if (key === "refleksi_dan_feedback") {
    if (sections.refleksi_dan_feedback?.passed !== undefined) {
      return sections.refleksi_dan_feedback.passed;
    }
    const a = sections.refleksi_perkuliahan?.passed;
    const b = sections.feedback_dosen?.passed;
    if (a === undefined && b === undefined) return undefined;
    return Boolean(a) && Boolean(b);
  }

  return sections[key]?.passed;
}

export function buildSubmissionExportRows(submissions: SubmissionPublic[]) {
  const header = [
    "Kelas",
    "Nama Mahasiswa",
    "NPM",
    "Dikumpulkan",
    ...EXPORT_RUBRIC_KEYS.map((key) => rubricExportLabel(key)),
    "Skor",
  ];

  const rows = submissions.map((s) => {
    const sections = s.aiResult?.sections;
    return [
      s.kelas,
      s.nama,
      s.npm,
      formatDateTime(s.createdAt),
      ...EXPORT_RUBRIC_KEYS.map((key) =>
        checklistValue(getRubricPassed(sections as Record<string, { passed: boolean }> | undefined, key)),
      ),
      s.aiScore ?? "",
    ];
  });

  return { header, rows };
}

export async function downloadSubmissionsExcel(
  submissions: SubmissionPublic[],
) {
  const XLSX = await import("xlsx");
  const { header, rows } = buildSubmissionExportRows(submissions);
  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "UAS IoT");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `uas-iot-export-${Date.now()}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
