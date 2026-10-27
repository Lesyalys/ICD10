// src/components/EditableMedicationCard.tsx
import type { MedicationView } from "../utils/normalize.ts";

type Props = {
  item: MedicationView;
  isEditing: boolean;
  draft: {
    doseA: string;
    doseC: string;
    recipe: string;
  };
  onChange: (next: Props["draft"]) => void;
};

export default function EditableMedicationCard({
  item,
  isEditing,
  draft,
  onChange,
}: Props) {
  return (
    <li className="rounded-xl border border-slate-100 bg-[#f7f9fa] px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[14px] font-bold text-[#173653]">
          {item.name ?? "—"}
        </p>
        <div className="flex items-center gap-2">
          {item.atcCode && (
            <span className="rounded-md bg-[#e8eff5] px-2 py-0.5 text-[11px] font-bold text-[#173653]">
              {item.atcCode}
            </span>
          )}
          {item.unit && (
            <span className="text-[11px] text-slate-500">{item.unit}</span>
          )}
        </div>
      </div>

      {item.atcName && (
        <p className="mt-0.5 text-[11.5px] text-slate-500">{item.atcName}</p>
      )}

      {!isEditing && (
        <>
          {(item.doseA != null || item.doseC != null) && (
            <p className="mt-1 text-[12px] text-slate-500">
              {item.doseA != null && <>взрослый&nbsp;{item.doseA}</>}
              {item.doseA != null && item.doseC != null && " · "}
              {item.doseC != null && <>ребёнок&nbsp;{item.doseC}</>}
            </p>
          )}

          {item.recipe && (
            <p className="mt-2 whitespace-pre-wrap font-serif text-[13px] italic text-[#173653]">
              {item.recipe}
            </p>
          )}
        </>
      )}

      {isEditing && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11.5px] text-slate-500">
              Доза взрослый
              <input
                type="number"
                step="0.01"
                value={draft.doseA}
                onChange={(e) => onChange({ ...draft, doseA: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] font-semibold text-[#13263c] outline-none focus:border-[#356181]"
              />
            </label>

            <label className="text-[11.5px] text-slate-500">
              Доза ребёнок
              <input
                type="number"
                step="0.01"
                value={draft.doseC}
                onChange={(e) => onChange({ ...draft, doseC: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] font-semibold text-[#13263c] outline-none focus:border-[#356181]"
              />
            </label>
          </div>

          <label className="block text-[11.5px] text-slate-500">
            Рецепт
            <textarea
              rows={3}
              value={draft.recipe}
              onChange={(e) => onChange({ ...draft, recipe: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] font-serif italic text-[#13263c] outline-none focus:border-[#356181]"
            />
          </label>
        </div>
      )}
    </li>
  );
}
