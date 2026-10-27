// src/components/TacticsListWithCalculator.tsx
import type { MedicationView } from "../utils/normalize.ts";
import DoseCalculator from "./DoseCalculator.tsx";

const EMPTY = "—";

export default function TacticsListWithCalculator({
  items,
}: {
  items: MedicationView[];
}) {
  const rows = items.filter((m) => m.tactics.length > 0);
  if (!rows.length) {
    return <p className="text-[13px] text-slate-400">{EMPTY}</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((m) => (
        <div
          key={m.id}
          className="rounded-xl border border-slate-100 bg-white px-4 py-3"
        >
          <p className="text-[12.5px] font-bold text-[#356181]">
            {m.name ?? EMPTY}
          </p>

          <ol className="mt-2 space-y-3">
            {m.tactics.map((t) => (
              <li key={t.id} className="rounded-lg bg-[#f7f9fa] px-3 py-2">
                {t.text && (
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#263a4e]">
                    {t.text}
                  </p>
                )}
                <div className="mt-1 flex flex-col gap-0.5 text-[11.5px] text-slate-500">
                  {t.routes && (
                    <span>
                      <span className="font-semibold text-slate-600">
                        Пути введения:
                      </span>{" "}
                      {t.routes}
                    </span>
                  )}
                  {t.condition && (
                    <span>
                      <span className="font-semibold text-slate-600">
                        Условие:
                      </span>{" "}
                      {t.condition}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <DoseCalculator doseA={t.doseA} doseC={t.doseC} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
