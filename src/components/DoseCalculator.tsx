// src/components/DoseCalculator.tsx
import { useState } from "react";
import { calcDose, parseWeight, type DoseMode } from "../utils/dose.ts";

type Props = {
  doseA: number | null;
  doseC: number | null;
  compact?: boolean;
};

export default function DoseCalculator({
  doseA,
  doseC,
  compact = false,
}: Props) {
  const [mode, setMode] = useState<DoseMode>("adult");
  const [weight, setWeight] = useState("");

  const weightKg = parseWeight(weight);
  const baseDose = mode === "adult" ? doseA : doseC;
  const result = calcDose(baseDose, weightKg);

  return (
    <div className="rounded-lg border border-dashed border-[#c7d2fe] bg-[#eef2ff] px-3 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
          {(
            [
              ["adult", "Взрослый"],
              ["child", "Ребёнок"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setMode(v)}
              className={`rounded-md px-3 py-1.5 text-[12px] font-bold transition ${
                mode === v
                  ? "bg-[#173653] text-white"
                  : "text-slate-500 hover:text-[#173653]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-slate-600">Вес</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="кг"
            className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] font-semibold text-[#13263c] outline-none focus:border-[#356181]"
          />
          <span className="text-[12px] text-slate-400">кг</span>
        </label>
      </div>

      <div className="mt-2">
        {weightKg <= 0 ? (
          <p className="text-[11.5px] text-slate-500">
            Введите вес, чтобы рассчитать дозу
          </p>
        ) : baseDose == null ? (
          <p className="text-[11.5px] text-slate-500">
            Для режима «{mode === "adult" ? "Взрослый" : "Ребёнок"}» доза не
            задана
          </p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[11.5px] text-slate-500">
              {mode === "adult" ? "Взрослый" : "Ребёнок"}:{" "}
              <strong>{baseDose}</strong> × {weightKg} кг =
            </span>
            <span className="text-[15px] font-extrabold text-[#173653]">
              {result}
            </span>
            <span className="text-[11px] text-slate-400">(расчётная доза)</span>
          </div>
        )}
      </div>

      {!compact && (
        <p className="mt-1 text-[11px] text-slate-400">
          Расчёт по весу: доза препарата × вес. Тестовая формула.
        </p>
      )}
    </div>
  );
}
