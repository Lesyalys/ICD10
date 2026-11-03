// src/components/EditableMedicationsList.tsx
import { useEffect, useState } from "react";
import type { AtxNode } from "../DB/queries.ts";
import type {
  MedicationView,
  MedicationConditionView,
} from "../utils/normalize.ts";
import RoutesSelect from "./RoutesSelect.tsx";

/* ============================================================
   ТИПЫ
   ============================================================ */

export type ConditionDraft = {
  routes: string;
  condition: string;
  doseA: string;
  doseC: string;
  priority: string;
};

export type NewConditionDraft = ConditionDraft & {
  tempId: string;
  existingId: number | null;
};

export type NewMedDraft = {
  tempId: string;
  existingId: number | null;
  name: string;
  unit: string;
  content: string;
  /** Рецепт хранится на препарате (ATX_AMBULANCE.RECIPE) */
  recipe: string;
  condition: ConditionDraft;
};

export type MedDrafts = Record<
  number,
  {
    /** Ключ — linkId (ID строки DIAGNOSIS_MEDICATION_TACTIC). */
    conditions: Record<number, ConditionDraft>;
  }
>;

export type DraftsState = {
  drafts: MedDrafts;
  newMeds: NewMedDraft[];
  newConditions: Record<number, NewConditionDraft[]>;
  deletedMeds: number[];
  deletedConditions: Array<{ medId: number; linkId: number }>;
};

export const emptyDraftsState: DraftsState = {
  drafts: {},
  newMeds: [],
  newConditions: {},
  deletedMeds: [],
  deletedConditions: [],
};

/* ============================================================
   ХЕЛПЕРЫ
   ============================================================ */

function emptyConditionDraft(): ConditionDraft {
  return {
    routes: "",
    condition: "",
    doseA: "",
    doseC: "",
    priority: "",
  };
}

function conditionToDraft(c: MedicationConditionView): ConditionDraft {
  return {
    routes: c.routes ?? "",
    condition: c.condition ?? "",
    doseA: c.doseA != null ? String(c.doseA) : "",
    doseC: c.doseC != null ? String(c.doseC) : "",
    priority: c.priority ?? "",
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
      const conditions: Record<number, ConditionDraft> = {};
      for (const c of m.conditions) conditions[c.linkId] = conditionToDraft(c);
      initial[m.id] = { conditions };
    }
    const next: DraftsState = {
      drafts: initial,
      newMeds: [],
      newConditions: {},
      deletedMeds: [],
      deletedConditions: [],
    };
    setState(next);
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // pickedMed → добавить новый препарат (с одним пустым условием)
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
          condition: emptyConditionDraft(),
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
          condition: emptyConditionDraft(),
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

  function updateCondition(
    medId: number,
    linkId: number,
    patch: Partial<ConditionDraft>,
  ) {
    const med = state.drafts[medId] ?? { conditions: {} };
    const base = med.conditions[linkId] ?? emptyConditionDraft();
    emit({
      ...state,
      drafts: {
        ...state.drafts,
        [medId]: {
          conditions: { ...med.conditions, [linkId]: { ...base, ...patch } },
        },
      },
    });
  }

  function addNewCondition(medId: number) {
    const c: NewConditionDraft = {
      ...emptyConditionDraft(),
      tempId: `c-${medId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      existingId: null,
    };
    emit({
      ...state,
      newConditions: {
        ...state.newConditions,
        [medId]: [...(state.newConditions[medId] ?? []), c],
      },
    });
  }

  function updateNewCondition(
    medId: number,
    tempId: string,
    patch: Partial<NewConditionDraft>,
  ) {
    emit({
      ...state,
      newConditions: {
        ...state.newConditions,
        [medId]: (state.newConditions[medId] ?? []).map((c) =>
          c.tempId === tempId ? { ...c, ...patch } : c,
        ),
      },
    });
  }

  function removeNewCondition(medId: number, tempId: string) {
    emit({
      ...state,
      newConditions: {
        ...state.newConditions,
        [medId]: (state.newConditions[medId] ?? []).filter(
          (c) => c.tempId !== tempId,
        ),
      },
    });
  }

  function toggleDeleteCondition(medId: number, linkId: number) {
    const exists = state.deletedConditions.some(
      (x) => x.medId === medId && x.linkId === linkId,
    );
    const deletedConditions = exists
      ? state.deletedConditions.filter(
          (x) => !(x.medId === medId && x.linkId === linkId),
        )
      : [...state.deletedConditions, { medId, linkId }];
    emit({ ...state, deletedConditions });
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

  function updateNewMedCondition(
    tempId: string,
    patch: Partial<ConditionDraft>,
  ) {
    emit({
      ...state,
      newMeds: state.newMeds.map((n) =>
        n.tempId === tempId
          ? { ...n, condition: { ...n.condition, ...patch } }
          : n,
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
        const medDraft = state.drafts[m.id] ?? { conditions: {} };

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
                {/* Существующие условия применения */}
                <div className="mt-2 space-y-2">
                  {m.conditions.map((c) => {
                    const cDeleted = state.deletedConditions.some(
                      (x) => x.medId === m.id && x.linkId === c.linkId,
                    );
                    const cDraft =
                      medDraft.conditions[c.linkId] ?? conditionToDraft(c);

                    return (
                      <div
                        key={c.linkId}
                        className={`rounded-lg border bg-white px-3 py-2 ${
                          cDeleted
                            ? "border-red-200 opacity-60"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[11.5px] font-bold text-slate-500">
                            Условие #{c.linkId}
                          </p>
                          {isEditing && (
                            <button
                              className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                cDeleted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                              onClick={() =>
                                toggleDeleteCondition(m.id, c.linkId)
                              }
                              type="button"
                            >
                              {cDeleted ? "Восстановить" : "Удалить условие"}
                            </button>
                          )}
                        </div>

                        {isEditing && !cDeleted ? (
                          <div className="mt-2 space-y-2">
                            <input
                              type="text"
                              value={cDraft.condition}
                              onChange={(e) =>
                                updateCondition(m.id, c.linkId, {
                                  condition: e.target.value,
                                })
                              }
                              placeholder="Условие"
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                            />
                            <RoutesSelect
                              value={cDraft.routes}
                              onChange={(v) =>
                                updateCondition(m.id, c.linkId, { routes: v })
                              }
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={cDraft.doseA}
                                onChange={(e) =>
                                  updateCondition(m.id, c.linkId, {
                                    doseA: e.target.value,
                                  })
                                }
                                placeholder="Доза взр."
                                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={cDraft.doseC}
                                onChange={(e) =>
                                  updateCondition(m.id, c.linkId, {
                                    doseC: e.target.value,
                                  })
                                }
                                placeholder="Доза реб."
                                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                              />
                            </div>
                            <input
                              type="text"
                              value={cDraft.priority}
                              onChange={(e) =>
                                updateCondition(m.id, c.linkId, {
                                  priority: e.target.value,
                                })
                              }
                              placeholder="Приоритет"
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                            />
                          </div>
                        ) : (
                          <div className="mt-1 text-[12px] text-slate-600">
                            {c.condition && (
                              <p>
                                <b>Условие:</b> {c.condition}
                              </p>
                            )}
                            {c.routes && (
                              <p>
                                <b>Пути:</b> {c.routes}
                              </p>
                            )}
                            {(c.doseA != null || c.doseC != null) && (
                              <p>
                                <b>Дозы:</b>{" "}
                                {c.doseA != null && <>взр. {c.doseA}</>}
                                {c.doseA != null && c.doseC != null && " · "}
                                {c.doseC != null && <>реб. {c.doseC}</>}
                              </p>
                            )}
                            {c.priority && (
                              <p>
                                <b>Приоритет:</b> {c.priority}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Новые условия для существующего препарата */}
                {(state.newConditions[m.id] ?? []).map((nc) => (
                  <div
                    key={nc.tempId}
                    className="mt-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[11.5px] font-bold text-emerald-700">
                        Новое условие
                      </p>
                      <button
                        className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600"
                        onClick={() => removeNewCondition(m.id, nc.tempId)}
                        type="button"
                      >
                        Убрать
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={nc.condition}
                        onChange={(e) =>
                          updateNewCondition(m.id, nc.tempId, {
                            condition: e.target.value,
                          })
                        }
                        placeholder="Условие"
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                      />
                      <RoutesSelect
                        value={nc.routes}
                        onChange={(v) =>
                          updateNewCondition(m.id, nc.tempId, { routes: v })
                        }
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={nc.doseA}
                          onChange={(e) =>
                            updateNewCondition(m.id, nc.tempId, {
                              doseA: e.target.value,
                            })
                          }
                          placeholder="Доза взр."
                          className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={nc.doseC}
                          onChange={(e) =>
                            updateNewCondition(m.id, nc.tempId, {
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
                    onClick={() => addNewCondition(m.id)}
                  >
                    + Добавить условие
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
                ? `Дополнительное условие для препарата «${n.name || "—"}»`
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
            <p className="text-[11.5px] font-bold text-slate-500">
              Условие применения
            </p>
            <input
              type="text"
              value={n.condition.condition}
              onChange={(e) =>
                updateNewMedCondition(n.tempId, { condition: e.target.value })
              }
              placeholder="Условие"
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
            />
            <RoutesSelect
              value={n.condition.routes}
              onChange={(v) => updateNewMedCondition(n.tempId, { routes: v })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={n.condition.doseA}
                onChange={(e) =>
                  updateNewMedCondition(n.tempId, { doseA: e.target.value })
                }
                placeholder="Доза взр."
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
              />
              <input
                type="number"
                step="0.01"
                value={n.condition.doseC}
                onChange={(e) =>
                  updateNewMedCondition(n.tempId, { doseC: e.target.value })
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
