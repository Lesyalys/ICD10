export type DoseMode = "adult" | "child";

/**
 * Тестовая формула: итог = базовая_доза × вес.
 * Позже заменим на клиническую (мг/кг × вес с capping).
 */
export function calcDose(
  baseDose: number | null,
  weightKg: number,
): number | null {
  if (baseDose == null || !Number.isFinite(weightKg) || weightKg <= 0) {
    return null;
  }
  return +(baseDose * weightKg).toFixed(2);
}

export function parseWeight(input: string): number {
  const n = parseFloat(input.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
