// src/components/EditableMedicationsList.tsx
import { useEffect, useState } from "react";
import type { AtxNode } from "../DB/queries.ts";
import type { MedicationView, MedicationTactic } from "../utils/normalize.ts";
import RoutesSelect from "./RoutesSelect.tsx";

/* ============================================================
   ТИПЫ
   ============================================================ */

export type TacticDraft = {
  text: string;
  routes: string;
  condition: string;
  doseA: string;
  doseC: string;
  priority: string;
};

export type NewTacticDraft = TacticDraft & {
  tempId: string;
  existingId: number | null;
};

export type NewMedDraft = {
  tempId: string;
  existingId: number | null;
  name: string;
  unit: string;
  content: string;
  /** Рецепт хранится на препарате (ATX_AMBULANCE.RECIPE), не на тактике */
  recipe: string;
  tactic: TacticDraft;
};

export type MedDrafts = Record<
  number,
  {
    /** Ключ — linkId (ID строки DIAGNOSIS_MEDICATION_TACTIC). */
    tactics: Record<number, TacticDraft>;
  }
>;

export type DraftsState = {
  drafts: MedDrafts;
  newMeds: NewMedDraft[];
  newTactics: Record<number, NewTacticDraft[]>;
  deletedMeds: number[];
  /** Удалённые связи: текст тактики хранится в строке связи. */
  deletedTactics: Array<{ medId: number; linkId: number }>;
};

export const emptyDraftsState: DraftsState = {
  drafts: {},
  newMeds: [],
  newTactics: {},
  deletedMeds: [],
  deletedTactics: [],
};

/* ============================================================
   ХЕЛПЕРЫ
   ============================================================ */

function emptyTacticDraft(): TacticDraft {
  return {
    text: "",
    routes: "",
    condition: "",
    doseA: "",
    doseC: "",
    priority: "",
  };
}

function tacticToDraft(t: MedicationTactic): TacticDraft {
  return {
    text: t.text ?? "",
    routes: t.routes ?? "",
    condition: t.condition ?? "",
    doseA: t.doseA != null ? String(t.doseA) : "",
    doseC: t.doseC != null ? String(t.doseC) : "",
    priority: t.priority ?? "",
  };
}

/* ============================================================
   ПРОПСЫ
   ============================================================ */

type Props = {
  items: MedicationView[];
  isEditing: boolean;
  onRequestPicker: () => void;
  pickedMed: AtxNode | null;
  createBlank: boolean;
  onConsumeExternal: () => void;
  onEditMedication: (med: {
    id: number;
    name: string | null;
    unit: string | null;
    content: string | null;
    recipe: string | null;
  }) => void;
  onChange: (state: DraftsState) => void;
};

/* ============================================================
   КОМПОНЕНТ
   ============================================================ */

export default function EditableMedicationsList({
  items,
  isEditing,
  onRequestPicker,
  pickedMed,
  createBlank,
  onConsumeExternal,
  onEditMedication,
  onChange,
}: Props) {
  const [state, setState] = useState<DraftsState>(emptyDraftsState);

  // Инициализация черновиков при смене items
  useEffect(() => {
    const initial: MedDrafts = {};
    for (const m of items) {
      const tactics: Record<number, TacticDraft> = {};
      for (const t of m.tactics) tactics[t.linkId] = tacticToDraft(t);
      initial[m.id] = { tactics };
    }
    const next: DraftsState = {
      drafts: initial,
      newMeds: [],
      newTactics: {},
      deletedMeds: [],
      deletedTactics: [],
    };
    setState(next);
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // pickedMed → добавить новый препарат (с одной пустой тактикой)
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
    const next: DraftsState = {
      ...state,
      newMeds: [
        ...state.newMeds,
        {
          tempId: `p-${pickedMed.ID}-${Date.now()}`,
          existingId: pickedMed.ID,
          name: pickedMed.NAME ?? "",
          unit: pickedMed.UNIT ?? "",
          content: pickedMed.CONTENT ?? "",
          recipe: "",
          tactic: emptyTacticDraft(),
        },
      ],
    };
    emit(next);
    onConsumeExternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedMed]);

  // createBlank → создать новый препарат с нуля
  useEffect(() => {
    if (!createBlank) return;
    const next: DraftsState = {
      ...state,
      newMeds: [
        ...state.newMeds,
        {
          tempId: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          existingId: null,
          name: "",
          unit: "",
          content: "",
          recipe: "",
          tactic: emptyTacticDraft(),
        },
      ],
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
    linkId: number,
    patch: Partial<TacticDraft>,
  ) {
    const med = state.drafts[medId] ?? { tactics: {} };
    const base = med.tactics[linkId] ?? emptyTacticDraft();
    emit({
      ...state,
      drafts: {
        ...state.drafts,
        [medId]: {
          tactics: { ...med.tactics, [linkId]: { ...base, ...patch } },
        },
      },
    });
  }

  function addNewTactic(medId: number) {
    const t: NewTacticDraft = {
      ...emptyTacticDraft(),
      tempId: `t-${medId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      existingId: null,
    };
    emit({
      ...state,
      newTactics: {
        ...state.newTactics,
        [medId]: [...(state.newTactics[medId] ?? []), t],
      },
    });
  }

  function updateNewTactic(
    medId: number,
    tempId: string,
    patch: Partial<NewTacticDraft>,
  ) {
    emit({
      ...state,
      newTactics: {
        ...state.newTactics,
        [medId]: (state.newTactics[medId] ?? []).map((t) =>
          t.tempId === tempId ? { ...t, ...patch } : t,
        ),
      },
    });
  }

  function removeNewTactic(medId: number, tempId: string) {
    emit({
      ...state,
      newTactics: {
        ...state.newTactics,
        [medId]: (state.newTactics[medId] ?? []).filter(
          (t) => t.tempId !== tempId,
        ),
      },
    });
  }

  function toggleDeleteTactic(medId: number, linkId: number) {
    const exists = state.deletedTactics.some(
      (x) => x.medId === medId && x.linkId === linkId,
    );
    const deletedTactics = exists
      ? state.deletedTactics.filter(
          (x) => !(x.medId === medId && x.linkId === linkId),
        )
      : [...state.deletedTactics, { medId, linkId }];
    emit({ ...state, deletedTactics });
  }

  function toggleDeleteMed(medId: number) {
    const exists = state.deletedMeds.includes(medId);
    const deletedMeds = exists
      ? state.deletedMeds.filter((x) => x !== medId)
      : [...state.deletedMeds, medId];
    emit({ ...state, deletedMeds });
  }

  function updateNewMed(tempId: string, patch: Partial<NewMedDraft>) {
    emit({
      ...state,
      newMeds: state.newMeds.map((n) =>
        n.tempId === tempId ? { ...n, ...patch } : n,
      ),
    });
  }

  function updateNewMedTactic(tempId: string, patch: Partial<TacticDraft>) {
    emit({
      ...state,
      newMeds: state.newMeds.map((n) =>
        n.tempId === tempId ? { ...n, tactic: { ...n.tactic, ...patch } } : n,
      ),
    });
  }

  function removeNewMed(tempId: string) {
    emit({
      ...state,
      newMeds: state.newMeds.filter((n) => n.tempId !== tempId),
    });
  }

  /* ============================================================
     РЕНДЕР
     ============================================================ */

  return (
    <div className="space-y-2.5">
      {/* Существующие препараты */}
      {items.map((m) => {
        const isDeleted = state.deletedMeds.includes(m.id);
        const medDraft = state.drafts[m.id] ?? { tactics: {} };

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
                  <>
                    <button
                      className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                      onClick={() =>
                        onEditMedication({
                          id: m.id,
                          name: m.name,
                          unit: m.unit,
                          content: m.content,
                          recipe: m.recipe,
                        })
                      }
                      type="button"
                    >
                      Редактировать
                    </button>
                    <button
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        isDeleted
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                      onClick={() => toggleDeleteMed(m.id)}
                      type="button"
                    >
                      {isDeleted ? "Восстановить" : "Удалить"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {m.recipe && (
              <p className="mt-1 whitespace-pre-wrap font-serif text-[12px] italic text-slate-600">
                {m.recipe}
              </p>
            )}

            {!isDeleted && (
              <>
                {/* Существующие тактики */}
                <div className="mt-2 space-y-2">
                  {m.tactics.map((t) => {
                    const tDeleted = state.deletedTactics.some(
                      (x) => x.medId === m.id && x.linkId === t.linkId,
                    );
                    const tDraft =
                      medDraft.tactics[t.linkId] ?? tacticToDraft(t);

                    return (
                      <div
                        key={t.linkId}
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
                              onClick={() => toggleDeleteTactic(m.id, t.linkId)}
                              type="button"
                            >
                              {tDeleted ? "Восстановить" : "Удалить тактику"}
                            </button>
                          )}
                        </div>

                        {isEditing && !tDeleted ? (
                          <div className="mt-2 space-y-2">
                            {/* ← текст тактики (TACTIK_TEXT из строки связи) */}
                            {/* <textarea
                              rows={2}
                              value={tDraft.text}
                              onChange={(e) =>
                                updateTactic(m.id, t.linkId, {
                                  text: e.target.value,
                                })
                              }
                              placeholder="Текст тактики"
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                            /> */}

                            <input
                              type="text"
                              value={tDraft.condition}
                              onChange={(e) =>
                                updateTactic(m.id, t.linkId, {
                                  condition: e.target.value,
                                })
                              }
                              placeholder="Условие"
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                            />
                            <RoutesSelect
                              value={tDraft.routes}
                              onChange={(v) =>
                                updateTactic(m.id, t.linkId, { routes: v })
                              }
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={tDraft.doseA}
                                onChange={(e) =>
                                  updateTactic(m.id, t.linkId, {
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
                                  updateTactic(m.id, t.linkId, {
                                    doseC: e.target.value,
                                  })
                                }
                                placeholder="Доза реб."
                                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 text-[12px] text-slate-600">
                            {t.text && (
                              <p className="whitespace-pre-wrap">
                                <b>Тактика:</b> {t.text}
                              </p>
                            )}
                            {t.condition && (
                              <p>
                                <b>Условие:</b> {t.condition}
                              </p>
                            )}
                            {t.routes && (
                              <p>
                                <b>Пути:</b> {t.routes}
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
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Новые тактики для существующего препарата */}
                {(state.newTactics[m.id] ?? []).map((nt) => (
                  <div
                    key={nt.tempId}
                    className="mt-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11.5px] font-bold text-emerald-700">
                        Новая тактика
                      </p>
                      <button
                        className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600"
                        onClick={() => removeNewTactic(m.id, nt.tempId)}
                        type="button"
                      >
                        Убрать
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {/* <textarea
                        rows={2}
                        value={nt.text}
                        onChange={(e) =>
                          updateNewTactic(m.id, nt.tempId, {
                            text: e.target.value,
                          })
                        }
                        placeholder="Тактика"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                      /> */}
                      <RoutesSelect
                        value={nt.routes}
                        onChange={(v) =>
                          updateNewTactic(m.id, nt.tempId, { routes: v })
                        }
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={nt.doseA}
                          onChange={(e) =>
                            updateNewTactic(m.id, nt.tempId, {
                              doseA: e.target.value,
                            })
                          }
                          placeholder="Доза взр."
                          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={nt.doseC}
                          onChange={(e) =>
                            updateNewTactic(m.id, nt.tempId, {
                              doseC: e.target.value,
                            })
                          }
                          placeholder="Доза реб."
                          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {isEditing && (
                  <button
                    type="button"
                    className="mt-2 w-full rounded-lg border border-dashed border-emerald-400 bg-emerald-50 py-1.5 text-[11.5px] font-bold text-emerald-700 hover:bg-emerald-100"
                    onClick={() => addNewTactic(m.id)}
                  >
                    + Добавить тактику
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Новые препараты (черновики) */}
      {state.newMeds.map((n) => (
        <div
          key={n.tempId}
          className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-emerald-700">
              {n.existingId
                ? `Дополнительная тактика для препарата «${n.name || "—"}»`
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

          {!n.existingId && (
            <label className="mt-2 block text-[11.5px] text-slate-500">
              Рецепт (на препарате)
              <textarea
                rows={2}
                value={n.recipe}
                onChange={(e) =>
                  updateNewMed(n.tempId, { recipe: e.target.value })
                }
                placeholder="Например: Sol. Morphini hydrochloridi 1% - 1 ml"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-serif text-[13px] italic"
              />
            </label>
          )}

          <div className="mt-2 space-y-2">
            <p className="text-[11.5px] font-bold text-slate-500">Тактика</p>
            {/* <textarea
              rows={2}
              value={n.tactic.text}
              onChange={(e) =>
                updateNewMedTactic(n.tempId, { text: e.target.value })
              }
              placeholder="Тактика"
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
            /> */}
            <RoutesSelect
              value={n.tactic.routes}
              onChange={(v) => updateNewMedTactic(n.tempId, { routes: v })}
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
            <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>
      ))}

      {isEditing && (
        <button
          type="button"
          className="mt-1 w-full rounded-lg border border-dashed border-emerald-400 bg-emerald-50 py-2 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100"
          onClick={onRequestPicker}
        >
          + Добавить препарат
        </button>
      )}
    </div>
  );
}
