// src/components/EditableMedicationsList.tsx
import { useEffect, useState } from "react";
import type { AtxNode } from "../DB/queries.ts";
import type { MedicationView } from "../utils/normalize.ts";

export type TacticDraft = {
  text: string;
  routes: string;
  condition: string;
  doseA: string;
  doseC: string;
  recipe: string;
  next: string;
  priority: string;
};

export type NewMedDraft = {
  tempId: string;
  existingId: number | null;
  name: string;
  unit: string;
  content: string;
  /** Одна тактика для нового препарата */
  tactic: TacticDraft;
};

export type MedDrafts = Record<
  number,
  {
    /** правки существующих тактик по tactikId */
    tactics: Record<number, TacticDraft>;
  }
>;

export type DraftsState = {
  drafts: MedDrafts;
  newMeds: NewMedDraft[];
  deletedMeds: number[];
  deletedTactics: Array<{ medId: number; tactikId: number }>;
};

export const emptyDraftsState: DraftsState = {
  drafts: {},
  newMeds: [],
  deletedMeds: [],
  deletedTactics: [],
};

function emptyTacticDraft(): TacticDraft {
  return {
    text: "",
    routes: "",
    condition: "",
    doseA: "",
    doseC: "",
    recipe: "",
    next: "",
    priority: "",
  };
}

function tacticFromView(m: MedicationView, tId: number): TacticDraft {
  const t = m.tactics.find((x) => x.id === tId);
  if (!t) return emptyTacticDraft();
  return {
    text: t.text ?? "",
    routes: t.routes ?? "",
    condition: t.condition ?? "",
    doseA: t.doseA != null ? String(t.doseA) : "",
    doseC: t.doseC != null ? String(t.doseC) : "",
    recipe: t.recipe ?? "",
    next: t.next ?? "",
    priority: t.priority ?? "",
  };
}

function newMedFromExisting(med: AtxNode): NewMedDraft {
  return {
    tempId: `picked-${med.ID}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    existingId: med.ID,
    name: med.NAME ?? "",
    unit: med.UNIT ?? "",
    content: med.CONTENT ?? "",
    tactic: emptyTacticDraft(),
  };
}

function newMedEmpty(): NewMedDraft {
  return {
    tempId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    existingId: null,
    name: "",
    unit: "",
    content: "",
    tactic: emptyTacticDraft(),
  };
}

type Props = {
  items: MedicationView[];
  isEditing: boolean;
  onRequestPicker: () => void;
  pickedMed: AtxNode | null;
  createBlank: boolean;
  onConsumeExternal: () => void;
  onChange: (state: DraftsState) => void;
};

export default function EditableMedicationsList({
  items,
  isEditing,
  onRequestPicker,
  pickedMed,
  createBlank,
  onConsumeExternal,
  onChange,
}: Props) {
  const [state, setState] = useState<DraftsState>(emptyDraftsState);
  const [newTacticFor, setNewTacticFor] = useState<Record<number, TacticDraft>>(
    {},
  );

  useEffect(() => {
    const initialDrafts: MedDrafts = {};
    for (const m of items) {
      const t: Record<number, TacticDraft> = {};
      for (const x of m.tactics) t[x.id] = tacticFromView(m, x.id);
      initialDrafts[m.id] = { tactics: t };
    }
    const next: DraftsState = {
      drafts: initialDrafts,
      newMeds: [],
      deletedMeds: [],
      deletedTactics: [],
    };
    setState(next);
    setNewTacticFor({});
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    if (!pickedMed) return;
    if (pickedMed.LEVEL !== 2) {
      onConsumeExternal();
      return;
    }
    if (state.newMeds.some((n) => n.existingId === pickedMed.ID)) {
      onConsumeExternal();
      return;
    }
    const next = {
      ...state,
      newMeds: [...state.newMeds, newMedFromExisting(pickedMed)],
    };
    emit(next);
    onConsumeExternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedMed]);

  useEffect(() => {
    if (!createBlank) return;
    const next = {
      ...state,
      newMeds: [...state.newMeds, newMedEmpty()],
    };
    emit(next);
    onConsumeExternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createBlank]);

  function emit(next: DraftsState) {
    setState(next);
    onChange(next);
  }

  function updateTactic(
    medId: number,
    tactikId: number,
    patch: Partial<TacticDraft>,
  ) {
    const med = state.drafts[medId] ?? { tactics: {} };
    const base = med.tactics[tactikId] ?? emptyTacticDraft();
    const next: DraftsState = {
      ...state,
      drafts: {
        ...state.drafts,
        [medId]: {
          tactics: { ...med.tactics, [tactikId]: { ...base, ...patch } },
        },
      },
    };
    emit(next);
  }

  function toggleDeleteTactic(medId: number, tactikId: number) {
    const exists = state.deletedTactics.some(
      (x) => x.medId === medId && x.tactikId === tactikId,
    );
    const deletedTactics = exists
      ? state.deletedTactics.filter(
          (x) => !(x.medId === medId && x.tactikId === tactikId),
        )
      : [...state.deletedTactics, { medId, tactikId }];
    emit({ ...state, deletedTactics });
  }

  function toggleDeleteMed(medId: number) {
    const exists = state.deletedMeds.includes(medId);
    const deletedMeds = exists
      ? state.deletedMeds.filter((x) => x !== medId)
      : [...state.deletedMeds, medId];
    emit({ ...state, deletedMeds });
  }

  function updateNewTacticFor(medId: number, patch: Partial<TacticDraft>) {
    const base = newTacticFor[medId] ?? emptyTacticDraft();
    setNewTacticFor({ ...newTacticFor, [medId]: { ...base, ...patch } });
  }

  function addNewTactic(medId: number) {
    const t = newTacticFor[medId];
    if (!t) return;
    if (!t.text.trim() && !t.routes.trim()) {
      // пустую не добавляем
      return;
    }
    // добавляем как «новую тактику к существующему препарату»
    const next: DraftsState = {
      ...state,
      newMeds: [
        ...state.newMeds,
        {
          tempId: `add-${medId}-${Date.now()}`,
          existingId: medId,
          name: "",
          unit: "",
          content: "",
          tactic: t,
        },
      ],
    };
    emit(next);
    setNewTacticFor({ ...newTacticFor, [medId]: emptyTacticDraft() });
  }

  function updateNewMed(tempId: string, patch: Partial<NewMedDraft>) {
    const next: DraftsState = {
      ...state,
      newMeds: state.newMeds.map((n) =>
        n.tempId === tempId ? { ...n, ...patch } : n,
      ),
    };
    emit(next);
  }

  function updateNewMedTactic(tempId: string, patch: Partial<TacticDraft>) {
    const next: DraftsState = {
      ...state,
      newMeds: state.newMeds.map((n) =>
        n.tempId === tempId ? { ...n, tactic: { ...n.tactic, ...patch } } : n,
      ),
    };
    emit(next);
  }

  function removeNewMed(tempId: string) {
    const next: DraftsState = {
      ...state,
      newMeds: state.newMeds.filter((n) => n.tempId !== tempId),
    };
    emit(next);
  }

  return (
    <div className="space-y-2.5">
      {/* Существующие препараты */}
      {items.map((m) => {
        const isDeleted = state.deletedMeds.includes(m.id);
        const medDraft = state.drafts[m.id] ?? { tactics: {} };
        const newTactic = newTacticFor[m.id] ?? emptyTacticDraft();

        return (
          <div
            key={m.id}
            className={`rounded-xl border bg-[#f7f9fa] px-4 py-3 ${
              isDeleted ? "border-red-200 opacity-60" : "border-slate-100"
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-[14px] font-bold text-[#173653]">
                {m.name ?? "—"}
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
                {isEditing && (
                  <button
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      isDeleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                    onClick={() => toggleDeleteMed(m.id)}
                    type="button"
                  >
                    {isDeleted ? "Восстановить препарат" : "Удалить препарат"}
                  </button>
                )}
              </div>
            </div>

            {!isDeleted && (
              <>
                {/* Тактики препарата */}
                <div className="mt-2 space-y-2">
                  {m.tactics.map((t) => {
                    const tDeleted = state.deletedTactics.some(
                      (x) => x.medId === m.id && x.tactikId === t.id,
                    );
                    const tDraft =
                      medDraft.tactics[t.id] ?? tacticFromView(m, t.id);

                    return (
                      <div
                        key={t.id}
                        className={`rounded-lg border bg-white px-3 py-2 ${
                          tDeleted
                            ? "border-red-200 opacity-60"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[11.5px] font-bold text-slate-500">
                            Тактика #{t.id}
                          </p>
                          {isEditing && (
                            <button
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                tDeleted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                              onClick={() => toggleDeleteTactic(m.id, t.id)}
                              type="button"
                            >
                              {tDeleted ? "Восстановить" : "Удалить тактику"}
                            </button>
                          )}
                        </div>

                        {isEditing && !tDeleted ? (
                          <div className="mt-2 space-y-1.5">
                            <textarea
                              rows={2}
                              value={tDraft.text}
                              onChange={(e) =>
                                updateTactic(m.id, t.id, {
                                  text: e.target.value,
                                })
                              }
                              placeholder="Тактика"
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                            />
                            <input
                              type="text"
                              value={tDraft.routes}
                              onChange={(e) =>
                                updateTactic(m.id, t.id, {
                                  routes: e.target.value,
                                })
                              }
                              placeholder="Пути введения"
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                            />
                            <input
                              type="text"
                              value={tDraft.condition}
                              onChange={(e) =>
                                updateTactic(m.id, t.id, {
                                  condition: e.target.value,
                                })
                              }
                              placeholder="Условие"
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                            />
                            <div className="grid grid-cols-2 gap-1.5">
                              <input
                                type="number"
                                step="0.01"
                                value={tDraft.doseA}
                                onChange={(e) =>
                                  updateTactic(m.id, t.id, {
                                    doseA: e.target.value,
                                  })
                                }
                                placeholder="Доза взр."
                                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={tDraft.doseC}
                                onChange={(e) =>
                                  updateTactic(m.id, t.id, {
                                    doseC: e.target.value,
                                  })
                                }
                                placeholder="Доза реб."
                                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={tDraft.recipe}
                              onChange={(e) =>
                                updateTactic(m.id, t.id, {
                                  recipe: e.target.value,
                                })
                              }
                              placeholder="Рецепт"
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-serif italic text-[13px]"
                            />
                          </div>
                        ) : (
                          <div className="mt-1 text-[12px] text-slate-600">
                            {t.text && (
                              <p className="whitespace-pre-wrap">{t.text}</p>
                            )}
                            {t.routes && (
                              <p>
                                <b>Пути:</b> {t.routes}
                              </p>
                            )}
                            {t.condition && (
                              <p>
                                <b>Условие:</b> {t.condition}
                              </p>
                            )}
                            {(t.doseA != null || t.doseC != null) && (
                              <p>
                                <b>Дозы:</b>{" "}
                                {t.doseA != null && <>взр. {t.doseA}</>}
                                {t.doseA != null && t.doseC != null && " · "}
                                {t.doseC != null && <>реб. {t.doseC}</>}
                              </p>
                            )}
                            {t.recipe && (
                              <p className="font-serif italic">{t.recipe}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Новая тактика к существующему препарату */}
                {isEditing && (
                  <div className="mt-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 px-3 py-2">
                    <p className="text-[11.5px] font-bold text-emerald-700">
                      + Новая тактика для этого препарата
                    </p>
                    <textarea
                      rows={2}
                      value={newTactic.text}
                      onChange={(e) =>
                        updateNewTacticFor(m.id, { text: e.target.value })
                      }
                      placeholder="Тактика"
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                    />
                    <input
                      type="text"
                      value={newTactic.routes}
                      onChange={(e) =>
                        updateNewTacticFor(m.id, { routes: e.target.value })
                      }
                      placeholder="Пути введения"
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                    />
                    <div className="mt-1 grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={newTactic.doseA}
                        onChange={(e) =>
                          updateNewTacticFor(m.id, { doseA: e.target.value })
                        }
                        placeholder="Доза взр."
                        className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={newTactic.doseC}
                        onChange={(e) =>
                          updateNewTacticFor(m.id, { doseC: e.target.value })
                        }
                        placeholder="Доза реб."
                        className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={newTactic.recipe}
                      onChange={(e) =>
                        updateNewTacticFor(m.id, { recipe: e.target.value })
                      }
                      placeholder="Рецепт"
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-serif italic text-[13px]"
                    />
                    <button
                      type="button"
                      onClick={() => addNewTactic(m.id)}
                      className="mt-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                    >
                      Добавить тактику
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Черновики новых препаратов */}
      {state.newMeds.map((n) => (
        <div
          key={n.tempId}
          className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-emerald-700">
              {n.existingId
                ? `Дополнительная тактика для препарата #${n.name}`
                : "Новый препарат"}
            </p>
            <button
              className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600"
              onClick={() => removeNewMed(n.tempId)}
              type="button"
            >
              Убрать
            </button>
          </div>

          {!n.existingId && (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="text-[11.5px] text-slate-500">
                Название *
                <input
                  type="text"
                  value={n.name}
                  onChange={(e) =>
                    updateNewMed(n.tempId, { name: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                />
              </label>
              <label className="text-[11.5px] text-slate-500">
                Единица
                <input
                  type="text"
                  value={n.unit}
                  onChange={(e) =>
                    updateNewMed(n.tempId, { unit: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                />
              </label>
            </div>
          )}

          <div className="mt-2 space-y-1.5">
            <p className="text-[11.5px] font-bold text-slate-500">Тактика</p>
            <textarea
              rows={2}
              value={n.tactic.text}
              onChange={(e) =>
                updateNewMedTactic(n.tempId, { text: e.target.value })
              }
              placeholder="Тактика"
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
            />
            <input
              type="text"
              value={n.tactic.routes}
              onChange={(e) =>
                updateNewMedTactic(n.tempId, { routes: e.target.value })
              }
              placeholder="Пути введения"
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
            />
            <input
              type="text"
              value={n.tactic.condition}
              onChange={(e) =>
                updateNewMedTactic(n.tempId, { condition: e.target.value })
              }
              placeholder="Условие"
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
            />
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="number"
                step="0.01"
                value={n.tactic.doseA}
                onChange={(e) =>
                  updateNewMedTactic(n.tempId, { doseA: e.target.value })
                }
                placeholder="Доза взр."
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
              />
              <input
                type="number"
                step="0.01"
                value={n.tactic.doseC}
                onChange={(e) =>
                  updateNewMedTactic(n.tempId, { doseC: e.target.value })
                }
                placeholder="Доза реб."
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
              />
            </div>
            <textarea
              rows={2}
              value={n.tactic.recipe}
              onChange={(e) =>
                updateNewMedTactic(n.tempId, { recipe: e.target.value })
              }
              placeholder="Рецепт"
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-serif italic text-[13px]"
            />
          </div>
        </div>
      ))}

      {isEditing && (
        <button
          className="mt-1 w-full rounded-lg border border-dashed border-emerald-400 bg-emerald-50 py-2 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100"
          onClick={onRequestPicker}
          type="button"
        >
          + Добавить препарат
        </button>
      )}
    </div>
  );
}
