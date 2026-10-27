// src/screens/call-card/EditableMedicationsList.tsx
import { useEffect, useState } from "react";
import type {
  MedicationView,
  MedicationTactic,
} from "../../utils/normalize.ts";

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

export type MedDraft = {
  name: string;
  unit: string;
  content: string;
  tactics: Record<number, TacticDraft>;
};

export type MedDrafts = Record<
  number,
  {
    // правки существующих тактик по tactikId
    tactics: Record<
      number,
      {
        text: string;
        routes: string;
        condition: string;
        doseA: string;
        doseC: string;
        recipe: string;
        next: string;
        priority: string;
      }
    >;
  }
>;

export type NewTacticDraft = TacticDraft & {
  tempId: string;
  existingId: number | null; // если редактируется существующая
};

export type NewMedDraft = {
  tempId: string;
  existingId: number | null; // если выбран из справочника
  name: string;
  unit: string;
  content: string;
  tactic: TacticDraft; // одна тактика при создании
};

function tacticToDraft(t: MedicationTactic): TacticDraft {
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

function toDraft(m: MedicationView): MedDraft {
  const tactics: Record<number, TacticDraft> = {};
  for (const t of m.tactics) tactics[t.id] = tacticToDraft(t);
  return {
    name: m.name ?? "",
    unit: m.unit ?? "",
    content: m.content ?? "",
    tactics,
  };
}

type Props = {
  items: MedicationView[];
  isEditing: boolean;
  currentIcd10Id: number;
  parentInfo: Record<number, { id: number; code: string; name: string }>;
  onRequestPicker: () => void;
  pickedMed: {
    ID: number;
    NAME: string | null;
    UNIT: string | null;
    CONTENT: string | null;
  } | null;
  createBlank: boolean;
  onConsumeExternal: () => void;
  onChange: (state: {
    drafts: MedDrafts;
    newMeds: NewMedDraft[];
    deletedTactics: Array<{ medId: number; tactikId: number }>;
    deletedMeds: number[];
  }) => void;
};

export default function EditableMedicationsList({
  items,
  isEditing,
  currentIcd10Id,
  parentInfo,
  onRequestPicker,
  pickedMed,
  createBlank,
  onConsumeExternal,
  onChange,
}: Props) {
  const [drafts, setDrafts] = useState<MedDrafts>({});
  const [newMeds, setNewMeds] = useState<NewMedDraft[]>([]);
  const [newTactics, setNewTactics] = useState<
    Record<number, NewTacticDraft[]>
  >({});
  const [deletedTactics, setDeletedTactics] = useState<
    Array<{ medId: number; tactikId: number }>
  >([]);
  const [deletedMeds, setDeletedMeds] = useState<number[]>([]);

  useEffect(() => {
    const initial: MedDrafts = {};
    for (const m of items) initial[m.id] = toDraft(m);
    setDrafts(initial);
    setNewMeds([]);
    setNewTactics({});
    setDeletedTactics([]);
    setDeletedMeds([]);
    onChange({
      drafts: initial,
      newMeds: [],
      deletedTactics: [],
      deletedMeds: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // pickedMed → добавить новый препарат с одной тактикой
  useEffect(() => {
    if (!pickedMed) return;
    if (newMeds.some((n) => n.existingId === pickedMed.ID)) {
      onConsumeExternal();
      return;
    }
    const next: NewMedDraft[] = [
      ...newMeds,
      {
        tempId: `p-${pickedMed.ID}-${Date.now()}`,
        existingId: pickedMed.ID,
        name: pickedMed.NAME ?? "",
        unit: pickedMed.UNIT ?? "",
        content: pickedMed.CONTENT ?? "",
        tactic: emptyTacticDraft(),
      },
    ];
    emit(next, newTactics, deletedTactics, deletedMeds, drafts);
    onConsumeExternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedMed]);

  useEffect(() => {
    if (!createBlank) return;
    const next: NewMedDraft[] = [
      ...newMeds,
      {
        tempId: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        existingId: null,
        name: "",
        unit: "",
        content: "",
        tactic: emptyTacticDraft(),
      },
    ];
    emit(next, newTactics, deletedTactics, deletedMeds, drafts);
    onConsumeExternal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createBlank]);

  function emit(
    nm: NewMedDraft[],
    nt: Record<number, NewTacticDraft[]>,
    dt: Array<{ medId: number; tactikId: number }>,
    dm: number[],
    d: MedDrafts,
  ) {
    setNewMeds(nm);
    setNewTactics(nt);
    setDeletedTactics(dt);
    setDeletedMeds(dm);
    setDrafts(d);
    onChange({
      drafts: d,
      newMeds: nm,
      deletedTactics: dt,
      deletedMeds: dm,
    });
  }

  function updateMed(medId: number, patch: Partial<MedDraft>) {
    const base = drafts[medId] ?? toDraft(items.find((x) => x.id === medId)!);
    emit(newMeds, newTactics, deletedTactics, deletedMeds, {
      ...drafts,
      [medId]: { ...base, ...patch },
    });
  }

  function updateTactic(
    medId: number,
    tactikId: number,
    patch: Partial<TacticDraft>,
  ) {
    const base = drafts[medId];
    if (!base) return;
    const t = base.tactics[tactikId] ?? emptyTacticDraft();
    emit(newMeds, newTactics, deletedTactics, deletedMeds, {
      ...drafts,
      [medId]: {
        ...base,
        tactics: { ...base.tactics, [tactikId]: { ...t, ...patch } },
      },
    });
  }

  function addNewTactic(medId: number) {
    const t: NewTacticDraft = {
      ...emptyTacticDraft(),
      tempId: `t-${medId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      existingId: null,
    };
    emit(
      newMeds,
      { ...newTactics, [medId]: [...(newTactics[medId] ?? []), t] },
      deletedTactics,
      deletedMeds,
      drafts,
    );
  }

  function updateNewTactic(
    medId: number,
    tempId: string,
    patch: Partial<NewTacticDraft>,
  ) {
    emit(
      newMeds,
      {
        ...newTactics,
        [medId]: (newTactics[medId] ?? []).map((t) =>
          t.tempId === tempId ? { ...t, ...patch } : t,
        ),
      },
      deletedTactics,
      deletedMeds,
      drafts,
    );
  }

  function removeNewTactic(medId: number, tempId: string) {
    emit(
      newMeds,
      {
        ...newTactics,
        [medId]: (newTactics[medId] ?? []).filter((t) => t.tempId !== tempId),
      },
      deletedTactics,
      deletedMeds,
      drafts,
    );
  }

  function removeExistingTactic(medId: number, tactikId: number) {
    const exists = deletedTactics.some(
      (x) => x.medId === medId && x.tactikId === tactikId,
    );
    emit(
      newMeds,
      newTactics,
      exists
        ? deletedTactics.filter(
            (x) => !(x.medId === medId && x.tactikId === tactikId),
          )
        : [...deletedTactics, { medId, tactikId }],
      deletedMeds,
      drafts,
    );
  }

  function markMedDeleted(medId: number) {
    const isDel = deletedMeds.includes(medId);
    emit(
      newMeds,
      newTactics,
      deletedTactics,
      isDel ? deletedMeds.filter((x) => x !== medId) : [...deletedMeds, medId],
      drafts,
    );
  }

  function updateNewMed(tempId: string, patch: Partial<NewMedDraft>) {
    emit(
      newMeds.map((n) => (n.tempId === tempId ? { ...n, ...patch } : n)),
      newTactics,
      deletedTactics,
      deletedMeds,
      drafts,
    );
  }

  function removeNewMed(tempId: string) {
    emit(
      newMeds.filter((n) => n.tempId !== tempId),
      newTactics,
      deletedTactics,
      deletedMeds,
      drafts,
    );
  }

  // ---- render ----

  return (
    <div className="space-y-2.5">
      {items.map((m) => {
        const d = drafts[m.id] ?? toDraft(m);
        const isDeleted = deletedMeds.includes(m.id);
        const isLocal = m.icd10Id === currentIcd10Id;
        const parent = m.icd10Id ? parentInfo[m.icd10Id] : null;

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
                {isEditing && (
                  <button
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      isDeleted
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                    onClick={() => markMedDeleted(m.id)}
                    type="button"
                  >
                    {isDeleted ? "Восстановить" : "Удалить препарат"}
                  </button>
                )}
              </div>
            </div>

            {m.icd10Id != null && (
              <p className="mt-1">
                {isLocal ? (
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                    Привязан к этой болезни
                  </span>
                ) : (
                  <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[10.5px] font-bold text-amber-700">
                    Привязан к группе
                    {parent ? ` ${parent.code} — ${parent.name}` : ""}
                  </span>
                )}
              </p>
            )}

            {!isDeleted && (
              <>
                {isEditing && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={d.unit}
                      onChange={(e) =>
                        updateMed(m.id, { unit: e.target.value })
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                      placeholder="Единица"
                    />
                    <input
                      type="text"
                      value={d.content}
                      onChange={(e) =>
                        updateMed(m.id, { content: e.target.value })
                      }
                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                      placeholder="Состав"
                    />
                  </div>
                )}

                {/* Тактики */}
                <div className="mt-3 space-y-2">
                  {m.tactics.map((t) => {
                    const dt = d.tactics[t.id] ?? tacticToDraft(t);
                    const isTacticDeleted = deletedTactics.some(
                      (x) => x.medId === m.id && x.tactikId === t.id,
                    );

                    return (
                      <div
                        key={t.id}
                        className={`rounded-lg border bg-white px-3 py-2 ${
                          isTacticDeleted
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
                                isTacticDeleted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                              onClick={() => removeExistingTactic(m.id, t.id)}
                              type="button"
                            >
                              {isTacticDeleted
                                ? "Восстановить"
                                : "Удалить тактику"}
                            </button>
                          )}
                        </div>

                        {isEditing && !isTacticDeleted ? (
                          <div className="mt-2 space-y-2">
                            <textarea
                              rows={2}
                              value={dt.text}
                              onChange={(e) =>
                                updateTactic(m.id, t.id, {
                                  text: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                              placeholder="Тактика"
                            />
                            <input
                              type="text"
                              value={dt.routes}
                              onChange={(e) =>
                                updateTactic(m.id, t.id, {
                                  routes: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                              placeholder="Пути введения"
                            />
                            <input
                              type="text"
                              value={dt.condition}
                              onChange={(e) =>
                                updateTactic(m.id, t.id, {
                                  condition: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                              placeholder="Условие"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                step="0.01"
                                value={dt.doseA}
                                onChange={(e) =>
                                  updateTactic(m.id, t.id, {
                                    doseA: e.target.value,
                                  })
                                }
                                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                                placeholder="Доза взр."
                              />
                              <input
                                type="number"
                                step="0.01"
                                value={dt.doseC}
                                onChange={(e) =>
                                  updateTactic(m.id, t.id, {
                                    doseC: e.target.value,
                                  })
                                }
                                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                                placeholder="Доза реб."
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={dt.recipe}
                              onChange={(e) =>
                                updateTactic(m.id, t.id, {
                                  recipe: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-serif text-[13px] italic"
                              placeholder="Рецепт"
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

                  {/* Новые тактики для существующего препарата */}
                  {(newTactics[m.id] ?? []).map((nt) => (
                    <div
                      key={nt.tempId}
                      className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 px-3 py-2"
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
                        <textarea
                          rows={2}
                          value={nt.text}
                          onChange={(e) =>
                            updateNewTactic(m.id, nt.tempId, {
                              text: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                          placeholder="Тактика"
                        />
                        <input
                          type="text"
                          value={nt.routes}
                          onChange={(e) =>
                            updateNewTactic(m.id, nt.tempId, {
                              routes: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                          placeholder="Пути введения"
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
                            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                            placeholder="Доза взр."
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
                            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                            placeholder="Доза реб."
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={nt.recipe}
                          onChange={(e) =>
                            updateNewTactic(m.id, nt.tempId, {
                              recipe: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-serif text-[13px] italic"
                          placeholder="Рецепт"
                        />
                      </div>
                    </div>
                  ))}

                  {isEditing && !isDeleted && (
                    <button
                      type="button"
                      className="w-full rounded-lg border border-dashed border-emerald-400 bg-emerald-50 py-1.5 text-[11.5px] font-bold text-emerald-700 hover:bg-emerald-100"
                      onClick={() => addNewTactic(m.id)}
                    >
                      + Добавить тактику
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Черновики новых препаратов (пока без сохранения) */}
      {newMeds.map((n) => (
        <div
          key={n.tempId}
          className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-bold text-emerald-700">
              {n.existingId
                ? `Из справочника: ${n.name || "—"}`
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

          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={n.name}
              onChange={(e) => updateNewMed(n.tempId, { name: e.target.value })}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] font-semibold"
              placeholder="Название"
              disabled={!!n.existingId}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={n.unit}
                onChange={(e) =>
                  updateNewMed(n.tempId, { unit: e.target.value })
                }
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                placeholder="Единица"
              />
              <input
                type="text"
                value={n.content}
                onChange={(e) =>
                  updateNewMed(n.tempId, { content: e.target.value })
                }
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                placeholder="Состав"
              />
            </div>

            <p className="pt-1 text-[11px] font-bold text-slate-500">
              Тактика применения
            </p>
            <textarea
              rows={2}
              value={n.tactic.text}
              onChange={(e) =>
                updateNewMed(n.tempId, {
                  tactic: { ...n.tactic, text: e.target.value },
                })
              }
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
              placeholder="Тактика"
            />
            <input
              type="text"
              value={n.tactic.routes}
              onChange={(e) =>
                updateNewMed(n.tempId, {
                  tactic: { ...n.tactic, routes: e.target.value },
                })
              }
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
              placeholder="Пути введения"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={n.tactic.doseA}
                onChange={(e) =>
                  updateNewMed(n.tempId, {
                    tactic: { ...n.tactic, doseA: e.target.value },
                  })
                }
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                placeholder="Доза взр."
              />
              <input
                type="number"
                step="0.01"
                value={n.tactic.doseC}
                onChange={(e) =>
                  updateNewMed(n.tempId, {
                    tactic: { ...n.tactic, doseC: e.target.value },
                  })
                }
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
                placeholder="Доза реб."
              />
            </div>
            <textarea
              rows={2}
              value={n.tactic.recipe}
              onChange={(e) =>
                updateNewMed(n.tempId, {
                  tactic: { ...n.tactic, recipe: e.target.value },
                })
              }
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 font-serif text-[13px] italic"
              placeholder="Рецепт"
            />
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
