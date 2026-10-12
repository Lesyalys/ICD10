import type { MedicationView } from "../utils/normalize.ts";
import DoseCalculator from "./DoseCalculator.tsx";

const EMPTY = "—";

export default function TacticsList({ items }: { items: MedicationView[] }) {
  const rows = items.filter(
    (m) => m.tactik?.text || m.tactik?.routes || m.tactik?.next,
  );

  if (!rows.length) {
    return <p className="text-[13px] text-slate-400">{EMPTY}</p>;
  }

  return (
    <ol className="space-y-3">
      {rows.map((m) => {
        const title = m.name ?? m.atcName ?? EMPTY;
        const t = m.tactik!;
        return (
          <li
            key={m.id}
            className="rounded-xl border border-slate-100 bg-white px-4 py-3"
          >
            <p className="text-[12.5px] font-bold text-[#356181]">{title}</p>

            {t.text && (
              <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#263a4e]">
                При состоянии: {t.text}
              </p>
            )}

            <div className="mt-2 flex flex-col gap-1 text-[11.5px] text-slate-500">
              {t.routes && (
                <span>
                  <span className="font-semibold text-slate-600">
                    Пути введения:
                  </span>{" "}
                  {t.routes}
                </span>
              )}
              {(m.doseA != null || m.doseC != null) && (
                <span>
                  <span className="font-semibold text-slate-600">Дозы:</span>{" "}
                  {m.doseA != null && <>взрослый&nbsp;{m.doseA}</>}
                  {m.doseA != null && m.doseC != null && " · "}
                  {m.doseC != null && <>ребёнок&nbsp;{m.doseC}</>}
                </span>
              )}
              {t.next && (
                <span>
                  <span className="font-semibold text-slate-600">Далее:</span>{" "}
                  {t.next}
                </span>
              )}
            </div>

            {/* Калькулятор вынесен отдельно */}
            <div className="mt-3">
              <DoseCalculator doseA={m.doseA} doseC={m.doseC} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
