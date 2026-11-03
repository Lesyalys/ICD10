// src/components/MedicationEditorModal.tsx
import { useEffect, useState } from "react";
import { updateAtxAmbulance, type AtxAmbulanceShort } from "../DB/queries.ts";

type Initial = {
  NAME: string | null;
  UNIT: string | null;
  CONTENT: string | null;
  RECIPE: string | null;
};

type Props = {
  medId: number;
  initial: Initial;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

type Patch = Partial<
  Pick<AtxAmbulanceShort, "NAME" | "UNIT" | "CONTENT" | "RECIPE">
>;

export default function MedicationEditorModal({
  medId,
  initial,
  open,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(initial.NAME ?? "");
  const [unit, setUnit] = useState(initial.UNIT ?? "");
  const [content, setContent] = useState(initial.CONTENT ?? "");
  const [recipe, setRecipe] = useState(initial.RECIPE ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial.NAME ?? "");
      setUnit(initial.UNIT ?? "");
      setContent(initial.CONTENT ?? "");
      setRecipe(initial.RECIPE ?? "");
      setError(null);
    }
  }, [open, initial]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      if (!name.trim()) {
        throw new Error("Название препарата обязательно");
      }

      const patch: Patch = {};
      if (name !== (initial.NAME ?? "")) patch.NAME = name.trim() || null;
      if (unit !== (initial.UNIT ?? "")) patch.UNIT = unit.trim() || null;
      if (content !== (initial.CONTENT ?? ""))
        patch.CONTENT = content.trim() || null;
      if (recipe !== (initial.RECIPE ?? ""))
        patch.RECIPE = recipe.trim() || null;

      if (Object.keys(patch).length > 0) {
        const ok = await updateAtxAmbulance(medId, patch);
        if (!ok) throw new Error("Не удалось сохранить препарат");
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-extrabold">
            Редактирование препарата
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-500 hover:text-slate-700"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-[12px] text-slate-500">
            Название *
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-[#356181]"
            />
          </label>

          <label className="block text-[12px] text-slate-500">
            Единица (амп., таб., мл)
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-[#356181]"
            />
          </label>

          <label className="block text-[12px] text-slate-500">
            Состав / концентрация
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-[#356181]"
            />
          </label>

          <label className="block text-[12px] text-slate-500">
            Рецепт (общий для всех применений)
            <textarea
              rows={3}
              value={recipe}
              onChange={(e) => setRecipe(e.target.value)}
              placeholder="Например: Sol. Morphini hydrochloridi 1% - 1 ml"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-serif text-[14px] italic outline-none focus:border-[#356181]"
            />
          </label>

          {error && <p className="text-[12px] text-red-600">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg bg-slate-100 px-4 py-2 text-[13px] font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#173653] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#214564] disabled:opacity-60"
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
