// src/utils/normalize.ts
import type {
  AtxItem,
  MedicationWithCondition,
  MedicationCondition,
} from "../DB/queries.ts";

export function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export type MedicationConditionView = {
  id: number; // TACTIK.ID
  linkId: number; // DIAGNOSIS_MEDICATION_TACTIC.ID
  condition: string | null;
  routes: string | null;
  doseA: number | null;
  doseC: number | null;
  priority: string | null;
};

export type MedicationView = {
  id: number;
  name: string | null;
  content: string | null;
  unit: string | null;
  recipe: string | null;
  atcCode: string | null;
  atcName: string | null;
  atcNameEng: string | null;
  icd10Id: number | null;
  conditions: MedicationConditionView[];
};

function atxToView(a: AtxItem | null) {
  return {
    atcCode: a?.ATC_CODE ?? null,
    atcName: a?.ATC_NAME ?? null,
    atcNameEng: a?.ATC_NAME_ENG ?? null,
  };
}

function conditionToView(c: MedicationCondition): MedicationConditionView {
  return {
    id: c.ID,
    linkId: c.LINK_ID,
    condition: c.CONDITION,
    routes: c.ROUTES,
    doseA: c.DOSE_A,
    doseC: c.DOSE_C,
    priority: c.PRIORITY,
  };
}

export function toMedicationView(m: MedicationWithCondition): MedicationView {
  const atx = atxToView(first(m.med.АТХ));
  return {
    id: m.med.ID,
    name: m.med.NAME,
    content: m.med.CONTENT,
    unit: m.med.UNIT,
    recipe: m.med.RECIPE,
    icd10Id: m.med._icd10Id ?? null,
    ...atx,
    conditions: m.conditions.map(conditionToView),
  };
}

export function flattenConditions(
  items: MedicationWithCondition[] | null,
): MedicationView[] {
  return (items ?? []).map(toMedicationView);
}
