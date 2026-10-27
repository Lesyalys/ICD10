// src/utils/normalize.ts
import type {
  AtxItem,
  MedicationWithTactics,
  TactikItem,
} from "../DB/queries.ts";

export function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export type MedicationTactic = {
  id: number;
  text: string | null;
  routes: string | null;
  condition: string | null;
  doseA: number | null;
  doseC: number | null;
  recipe: string | null;
  next: string | null;
  priority: string | null;
};

export type MedicationView = {
  id: number;
  name: string | null;
  content: string | null;
  unit: string | null;
  atcCode: string | null;
  atcName: string | null;
  atcNameEng: string | null;
  icd10Id: number | null;
  tactics: MedicationTactic[];
};

function atxToView(a: AtxItem | null): {
  atcCode: string | null;
  atcName: string | null;
  atcNameEng: string | null;
} {
  return {
    atcCode: a?.ATC_CODE ?? null,
    atcName: a?.ATC_NAME ?? null,
    atcNameEng: a?.ATC_NAME_ENG ?? null,
  };
}

function tacticToView(t: TactikItem): MedicationTactic {
  return {
    id: t.ID,
    text: t.TACTIK_TEXT,
    routes: t.ROUTES,
    condition: t.CONDITION,
    doseA: t.DOSE_A,
    doseC: t.DOSE_C,
    recipe: t.RECIPE,
    next: t.NEXT_TACTIK,
    priority: t.PRIORITY,
  };
}

export function toMedicationView(m: MedicationWithTactics): MedicationView {
  const atx = atxToView(first(m.med.АТХ));
  return {
    id: m.med.ID,
    name: m.med.NAME,
    content: m.med.CONTENT,
    unit: m.med.UNIT,
    icd10Id: m.med._icd10Id ?? null,
    ...atx,
    tactics: m.tactics.map(tacticToView),
  };
}

export function flattenMedications(
  items: MedicationWithTactics[] | null,
): MedicationView[] {
  return (items ?? []).map(toMedicationView);
}
