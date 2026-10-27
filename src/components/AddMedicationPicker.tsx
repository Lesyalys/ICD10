// src/components/AddMedicationPicker.tsx
import { useEffect, useMemo, useState } from "react";
import {
  fetchAtxGroups,
  fetchAtxGroupChildren,
  searchAtxLeaves,
  type AtxNode,
} from "../DB/queries.ts";

type Props = {
  open: boolean;
  alreadyLinkedIds: number[];
  onPick: (med: AtxNode) => void;
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
  const [groups, setGroups] = useState<AtxNode[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [childrenByGroup, setChildrenByGroup] = useState<
    Record<number, AtxNode[]>
  >({});
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState<Set<number>>(new Set());

  const [searchResults, setSearchResults] = useState<AtxNode[]>([]);
  const [searching, setSearching] = useState(false);

  const linkedSet = useMemo(
    () => new Set(alreadyLinkedIds),
    [alreadyLinkedIds],
  );
  const searchMode = query.trim().length >= 2;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setLoadingGroups(true);
      const data = await fetchAtxGroups();
      if (!alive) return;
      setGroups(data);
      setLoadingGroups(false);
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const data = await searchAtxLeaves(q);
      setSearchResults(data);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  async function toggleGroup(g: AtxNode) {
    const id = g.ID;
    if (expanded.has(id)) {
      setExpanded((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      return;
    }
    if (!childrenByGroup[id]) {
      setLoadingGroup((s) => new Set(s).add(id));
      const data = await fetchAtxGroupChildren(id);
      setLoadingGroup((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      setChildrenByGroup((c) => ({ ...c, [id]: data }));
    }
    setExpanded((prev) => new Set(prev).add(id));
  }

  function pickLeaf(item: AtxNode) {
    if (item.LEVEL !== 2) {
      console.warn("[picker] не препарат:", item);
      return;
    }
    onPick(item);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-2xl rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold">
            Выбрать препарат из справочника
          </h3>
          <button
            className="text-slate-500 hover:text-slate-700"
            onClick={onClose}
            type="button"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <input
          type="search"
          placeholder="Поиск по названию препарата…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[14px] text-[#13263c] outline-none focus:border-[#356181]"
        />

        <div className="max-h-[55vh] overflow-y-auto">
          {searchMode ? (
            <>
              {searching && (
                <p className="py-4 text-center text-[13px] text-slate-400">
                  Поиск…
                </p>
              )}
              {!searching && searchResults.length === 0 && (
                <p className="py-4 text-center text-[13px] text-slate-400">
                  Ничего не найдено
                </p>
              )}
              {searchResults.map((item) => {
                const linked = linkedSet.has(item.ID);
                return (
                  <div key={item.ID} className="px-2">
                    <button
                      type="button"
                      disabled={linked}
                      onClick={() => pickLeaf(item)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50 disabled:opacity-50"
                    >
                      <span className="flex-1 text-[13.5px] font-semibold text-[#173653]">
                        {item.NAME ?? "—"}
                      </span>
                      {item.UNIT && (
                        <span className="shrink-0 text-[11px] text-slate-500">
                          {item.UNIT}
                        </span>
                      )}
                      {linked && (
                        <span className="ml-2 shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                          Уже привязан
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </>
          ) : loadingGroups ? (
            <p className="py-4 text-center text-[13px] text-slate-400">
              Загрузка…
            </p>
          ) : (
            groups.map((g) => {
              const isOpen = expanded.has(g.ID);
              const isLoading = loadingGroup.has(g.ID);
              const kids = childrenByGroup[g.ID];

              return (
                <div key={g.ID}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(g)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center text-[10px] text-slate-400">
                      {isLoading ? "…" : isOpen ? "▼" : "▶"}
                    </span>
                    <span className="flex-1 text-[13.5px] font-bold text-slate-700">
                      {g.NAME ?? "—"}
                    </span>
                  </button>

                  {isOpen && kids && (
                    <div className="pl-7">
                      {kids.length === 0 && (
                        <p className="px-2 py-1 text-[12px] text-slate-400">
                          Нет препаратов
                        </p>
                      )}
                      {kids.map((k) => {
                        const linked = linkedSet.has(k.ID);
                        return (
                          <button
                            key={k.ID}
                            type="button"
                            disabled={linked}
                            onClick={() => pickLeaf(k)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-slate-50 disabled:opacity-50"
                          >
                            <span className="flex-1 text-[13px] font-semibold text-[#173653]">
                              {k.NAME ?? "—"}
                            </span>
                            {k.UNIT && (
                              <span className="shrink-0 text-[11px] text-slate-500">
                                {k.UNIT}
                              </span>
                            )}
                            {linked && (
                              <span className="ml-2 shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                                Привязан
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
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
