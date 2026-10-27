// src/screens/call-card/AddMedicationPicker.tsx

import { useEffect, useMemo, useState } from "react";
import {
  fetchAllAtxAmbulance,
  type AtxAmbulanceShort,
} from "../../DB/queries.ts";

type Props = {
  open: boolean;
  alreadyLinkedIds: number[];
  onPick: (med: AtxAmbulanceShort) => void;
  onCreateNew: () => void;
  onClose: () => void;
};

export default function AddMedicationPicker({
  open,
  alreadyLinkedIds,
  onPick,
  onCreateNew,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AtxAmbulanceShort[]>([]);
  const [loading, setLoading] = useState(false);

  const linkedSet = useMemo(
    () => new Set(alreadyLinkedIds),
    [alreadyLinkedIds],
  );

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      const data = await fetchAllAtxAmbulance(query);
      if (!alive) return;
      setItems(data);
      setLoading(false);
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-2xl rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold">Выбрать препарат</h3>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <input
          type="search"
          placeholder="Поиск по названию препарата…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] outline-none focus:border-[#356181]"
        />

        <div className="max-h-[55vh] overflow-y-auto">
          {loading && (
            <p className="py-4 text-center text-[13px] text-slate-400">
              Поиск…
            </p>
          )}
          {!loading && items.length === 0 && (
            <p className="py-4 text-center text-[13px] text-slate-400">
              Ничего не найдено
            </p>
          )}
          <ul className="divide-y divide-slate-100">
            {items.map((m) => {
              const linked = linkedSet.has(m.ID);
              return (
                <li key={m.ID}>
                  <button
                    type="button"
                    disabled={linked}
                    onClick={() => onPick(m)}
                    className="flex w-full items-start gap-3 p-3 text-left transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-[#e8eff5] text-[11px] font-bold text-[#173653]">
                      +
                    </span>
                    <span className="flex-1">
                      <span className="block text-[14px] font-bold text-[#173653]">
                        {m.NAME ?? "—"}
                      </span>
                      {m.UNIT && (
                        <span className="mt-0.5 block text-[11.5px] text-slate-500">
                          {m.UNIT}
                        </span>
                      )}
                    </span>
                    {linked && (
                      <span className="ml-2 shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                        Уже привязан
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-3 flex justify-between gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100"
            onClick={onCreateNew}
          >
            + Создать новый препарат
          </button>
          <button
            type="button"
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-600 hover:bg-slate-200"
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
