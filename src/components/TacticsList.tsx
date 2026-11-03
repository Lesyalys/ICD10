// src/components/TacticsList.tsx
import type { MedicationView } from "../utils/normalize.ts";
import type { DraftsState } from "./EditableMedicationsList.tsx";

const EMPTY = "—";

type Props = {
  items: MedicationView[];
  isEditing?: boolean;
  draftMeds?: DraftsState;
  onDraftMedsChange?: (s: DraftsState) => void;
};

export default function TacticsList({
  items,
  isEditing = false,
  draftMeds,
  onDraftMedsChange,
}: Props) {
  // Показываем только те тактики, у которых есть текст (или которые редактируются)
  const rows = items
    .map((m) => ({
      med: m,
      tactics: m.tactics.filter(
        (t) => isEditing || (t.text ?? "").trim() !== "",
      ),
    }))
    .filter((r) => r.tactics.length > 0);

  if (!rows.length) {
    return <p className="text-[13px] text-slate-400">{EMPTY}</p>;
  }

  function updateText(medId: number, linkId: number, text: string) {
    if (!draftMeds || !onDraftMedsChange) return;
    const med = draftMeds.drafts[medId] ?? { tactics: {} };
    const base = med.tactics[linkId] ?? {
      text: "",
      routes: "",
      condition: "",
      doseA: "",
      doseC: "",
      priority: "",
    };
    onDraftMedsChange({
      ...draftMeds,
      drafts: {
        ...draftMeds.drafts,
        [medId]: {
          tactics: { ...med.tactics, [linkId]: { ...base, text } },
        },
      },
    });
  }

  return (
    <div className="space-y-3">
      {rows.map(({ med, tactics }) => (
        <div
          key={med.id}
          className="rounded-xl border border-slate-100 bg-white px-4 py-3"
        >
          <p className="text-[12.5px] font-bold text-[#356181]">
            {med.name ?? EMPTY}
          </p>
          <ol className="mt-2 space-y-3">
            {tactics.map((t) => {
              const draftText =
                draftMeds?.drafts[med.id]?.tactics[t.linkId]?.text ??
                t.text ??
                "";

              return (
                <li
                  key={t.linkId}
                  className="rounded-lg bg-[#f7f9fa] px-3 py-2"
                >
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={draftText}
                      onChange={(e) =>
                        updateText(med.id, t.linkId, e.target.value)
                      }
                      placeholder="Текст тактики"
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#263a4e]">
                      {t.text}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
