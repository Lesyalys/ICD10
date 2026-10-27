// src/components/MedicationsList.tsx
import type { MedicationView } from "../utils/normalize.ts";

const EMPTY = "—";

export default function MedicationsList({
  items,
}: {
  items: MedicationView[];
}) {
  if (!items.length) {
    return <p className="text-[13px] text-slate-400">{EMPTY}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((m) => (
        <li
          key={m.id}
          className="rounded-xl border border-slate-100 bg-[#f7f9fa] px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-[14px] font-bold text-[#173653]">
              {m.name ?? EMPTY}
            </p>
            <div className="flex items-center gap-2">
              {m.atcCode && (
                <span className="rounded-md bg-[#e8eff5] px-2 py-0.5 text-[11px] font-bold text-[#173653]">
                  {m.atcCode}
                </span>
              )}
              {m.unit && (
                <span className="text-[11px] text-slate-500">{m.unit}</span>
              )}
            </div>
          </div>

          {m.atcName && (
            <p className="mt-0.5 text-[11.5px] text-slate-500">{m.atcName}</p>
          )}

          {m.tactics.length > 0 && (
            <p className="mt-1 text-[11px] text-slate-400">
              Тактик: {m.tactics.length}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
