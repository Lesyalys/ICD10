import MedicationsList from "./MedicationsList.tsx";
import TacticsList from "./TacticsList.tsx";
import RecipesList from "./RecipesList.tsx";
import type { MedicationView } from "../utils/normalize.ts";
import MedicalField from "./MedicalField.tsx";

const EMPTY = "—";

type Props = {
  template: {
    COMPLAINTS: string | null;
    ANAMNESIS: string | null;
    OBJECTIVELY: string | null;
    LOCAL_STATUS: string | null;
  } | null;
  medications: MedicationView[];
};

export default function DiseaseTemplateCard({ template, medications }: Props) {
  return (
    <>
      {/* Общие поля */}
      <section className="px-5 pb-1 pt-5">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#e8eff5] text-[#24415e]">
            📋
          </span>
          <h3 className="text-[15px] font-extrabold">Общие поля</h3>
        </div>

        <MedicalField label="Жалобы">
          {template?.COMPLAINTS || EMPTY}
        </MedicalField>
        <MedicalField label="Анамнез заболевания">
          {template?.ANAMNESIS || EMPTY}
        </MedicalField>
        <MedicalField label="Объективно">
          {template?.OBJECTIVELY || EMPTY}
        </MedicalField>
        <MedicalField label="Локальный статус">
          {template?.LOCAL_STATUS || EMPTY}
        </MedicalField>
      </section>

      {/* Лекарства */}
      <section className="border-t-[7px] border-[#f2f5f7] px-5 py-5">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            ⚕️
          </span>
          <div>
            <h3 className="text-[15px] font-extrabold">Лекарства</h3>
            <p className="text-[11px] text-slate-400">
              Рекомендованные препараты
            </p>
          </div>
        </div>
        <MedicationsList items={medications} />
      </section>

      {/* Тактика */}
      <section className="border-t-[7px] border-[#f2f5f7] px-5 py-5">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            ❤️
          </span>
          <div>
            <h3 className="text-[15px] font-extrabold">Тактика</h3>
            <p className="text-[11px] text-slate-400">
              Дозы и рекомендации по применению
            </p>
          </div>
        </div>
        <TacticsList items={medications} />
      </section>

      {/* Рецепты */}
      <section className="border-t-[7px] border-[#f2f5f7] px-5 py-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            💊
          </span>
          <div>
            <h3 className="text-[15px] font-extrabold">Рецепты</h3>
            <p className="text-[11px] text-slate-400">
              Назначения по данному вызову
            </p>
          </div>
        </div>
        <RecipesList items={medications} />
      </section>
    </>
  );
}
