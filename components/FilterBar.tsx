"use client";

import { KELAS_OPTIONS } from "@/lib/constants";

interface FilterBarProps {
  selected: string;
  onChange: (kelas: string) => void;
  counts: Record<string, number>;
  total: number;
}

export function FilterBar({
  selected,
  onChange,
  counts,
  total,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterButton
        active={selected === ""}
        onClick={() => onChange("")}
        label={`Semua (${total})`}
      />
      {KELAS_OPTIONS.map((kelas) => (
        <FilterButton
          key={kelas}
          active={selected === kelas}
          onClick={() => onChange(kelas)}
          label={`${kelas} (${counts[kelas] ?? 0})`}
        />
      ))}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-blue-700 text-white"
          : "bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-800"
      }`}
    >
      {label}
    </button>
  );
}
