import { useState } from "react";
import { calcDose, parseWeight, type DoseMode } from "../utils/dose.ts";

type Props = {
  /** Доза для взрослого (DOSE_A) */
  doseA: number | null;
  /** Доза для ребёнка (DOSE_C) */
  doseC: number | null;
  /** Колбэк — сообщает родителю выбранный режим, вес и расчёт */
  onChange?: (state: {
    mode: DoseMode;
    weightKg: number;
    result: number | null;
  }) => void;
  /** Внешний режим (опционально — если родитель хочет синхронизировать) */
  mode?: DoseMode;
  /** Внешний вес (опционально) */
  weight?: string;
  /** Компактный вид без подписи формулы */
  compact?: boolean;
};

export default function DoseCalculator({
  doseA,
  doseC,
  onChange,
  mode: externalMode,
  weight: externalWeight,
  compact = false,
}: Props) {
  const [internalMode, setInternalMode] = useState<DoseMode>("adult");
  const [internalWeight, setInternalWeight] = useState("");

  const mode = externalMode ?? internalMode;
  const weight = externalWeight ?? internalWeight;

  const weightKg = parseWeight(weight);
  const baseDose = mode === "adult" ? doseA : doseC;
  const result = calcDose(baseDose, weightKg);

  function updateMode(next: DoseMode) {
    if (externalMode === undefined) setInternalMode(next);
    onChange?.({
      mode: next,
      weightKg,
      result: calcDose(next === "adult" ? doseA : doseC, weightKg),
    });
  }

  function updateWeight(next: string) {
    if (externalWeight === undefined) setInternalWeight(next);
    const kg = parseWeight(next);
    onChange?.({
      mode,
      weightKg: kg,
      result: calcDose(baseDose, kg),
    });
  }

  return (
    <div className="dose-calc">
      <div className="dose-calc__controls">
        <div className="dose-calc__toggle">
          {(
            [
              ["adult", "Взрослый"],
              ["child", "Ребёнок"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateMode(value)}
              className={`dose-calc__toggle-btn${
                mode === value ? " dose-calc__toggle-btn--active" : ""
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="dose-calc__weight">
          <span className="dose-calc__weight-label">Вес</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={weight}
            onChange={(e) => updateWeight(e.target.value)}
            placeholder="кг"
            className="dose-calc__weight-input"
          />
          <span className="dose-calc__weight-unit">кг</span>
        </label>
      </div>

      <div className="dose-calc__result">
        {weightKg <= 0 ? (
          <p className="dose-calc__hint">Введите вес, чтобы рассчитать дозу</p>
        ) : baseDose == null ? (
          <p className="dose-calc__hint">
            Для режима «{mode === "adult" ? "Взрослый" : "Ребёнок"}» доза не
            задана
          </p>
        ) : (
          <div className="dose-calc__formula">
            <span className="dose-calc__formula-part">
              {mode === "adult" ? "Взрослый" : "Ребёнок"}:{" "}
              <strong>{baseDose}</strong> × {weightKg} кг =
            </span>
            <span className="dose-calc__value">{result}</span>
            <span className="dose-calc__unit">(расчётная доза)</span>
          </div>
        )}
      </div>

      {!compact && (
        <p className="dose-calc__note">
          Расчёт по весу: доза препарата × вес. Тестовая формула.
        </p>
      )}
    </div>
  );
}
