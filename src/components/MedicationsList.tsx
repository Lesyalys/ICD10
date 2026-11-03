// src/components/MedicationsList.tsx
import type { MedicationView } from "../utils/normalize.ts";
import DoseCalculator from "./DoseCalculator.tsx";

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
          {/* Препарат */}
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

          {/* {m.atcName && (
            <p className="mt-0.5 text-[11.5px] text-slate-500">{m.atcName}</p>
          )} */}

          {m.content && (
            <p className="mt-0.5 text-[11.5px] text-slate-500">{m.content}</p>
          )}

          {m.recipe && (
            <p className="mt-1 whitespace-pre-wrap font-serif text-[12px] italic text-slate-600">
              {m.recipe}
            </p>
          )}

          {/* Вся инфа из TACTIK: условие, пути, дозы, приоритет */}
          {m.tactics.length > 0 && (
            <ul className="mt-2 space-y-2">
              {m.tactics.map((t) => (
                <li
                  key={t.linkId}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  {t.condition && (
                    <p className="text-[12px] text-slate-700">
                      <span className="font-semibold text-slate-600">
                        Условие:
                      </span>{" "}
                      {t.condition}
                    </p>
                  )}
                  {t.routes && (
                    <p className="mt-0.5 text-[12px] text-slate-700">
                      <span className="font-semibold text-slate-600">
                        Пути введения:
                      </span>{" "}
                      {t.routes}
                    </p>
                  )}
                  {(t.doseA != null || t.doseC != null) && (
                    <div className="mt-1">
                      <DoseCalculator doseA={t.doseA} doseC={t.doseC} />
                    </div>
                  )}
                  {t.priority && (
                    <p className="mt-0.5 text-[12px] text-slate-700">
                      <span className="font-semibold text-slate-600">
                        Приоритет:
                      </span>{" "}
                      {t.priority}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
