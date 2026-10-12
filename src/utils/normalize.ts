import type {
  AtxAmbulanceItem,
  AtxItem,
  DiseaseTemplateFull,
  TactikItem,
} from "../DB/queries.ts";

export function first<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export type MedicationView = {
  id: number;
  atcCode: string | null;
  atcName: string | null;
  atcNameEng: string | null;
  name: string | null;
  content: string | null;
  unit: string | null;
  doseA: number | null;
  doseC: number | null;
  recipe: string | null;
  tactik: {
    text: string | null;
    routes: string | null;
    next: string | null;
  } | null;
};

export function flattenMedications(
  template: DiseaseTemplateFull | null,
): MedicationView[] {
  const rows = template?.ATX_TEMPLATES_INFO ?? [];
  const out: MedicationView[] = [];

  for (const row of rows) {
    const m: AtxAmbulanceItem | null = first(row.ATX_AMBULANCE);
    if (!m) continue;

    const atx: AtxItem | null = first(m.АТХ);
    const tactik: TactikItem | null = first(m.TACTIK);

    out.push({
      id: m.ID,
      atcCode: atx?.ATC_CODE ?? null,
      atcName: atx?.ATC_NAME ?? null,
      atcNameEng: atx?.ATC_NAME_ENG ?? null,
      name: m.NAME,
      content: m.CONTENT,
      unit: m.UNIT,
      doseA: m.DOSE_A,
      doseC: m.DOSE_C,
      recipe: m.RECIPE,
      tactik: tactik
        ? {
            text: tactik.TACTIK_TEXT,
            routes: tactik.ROUTES,
            next: tactik.NEXT_TACTIK,
          }
        : null,
    });
  }

  return out;
}
