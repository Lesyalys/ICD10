// src/screens/call-card/CallCardTacticsSection.tsx
import TacticsList from "../../components/TacticsList.tsx";
import type { MedicationView } from "../../utils/normalize.ts";
import type { DraftsState } from "../../components/EditableMedicationsList.tsx";

export default function CallCardTacticsSection({
  medications,
  isEditing,
  draftMeds,
  onDraftMedsChange,
}: {
  medications: MedicationView[];
  isEditing: boolean;
  draftMeds: DraftsState;
  onDraftMedsChange: (s: DraftsState) => void;
}) {
  return (
    <section className="border-t-[7px] border-[#f2f5f7] px-5 py-5">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          ❤️
        </span>
        <div>
          <h3 className="text-[15px] font-extrabold">Тактика</h3>
          <p className="text-[11px] text-slate-400">
            Текст тактики по диагнозу
          </p>
        </div>
      </div>
      <TacticsList
        items={medications}
        isEditing={isEditing}
        draftMeds={draftMeds}
        onDraftMedsChange={onDraftMedsChange}
      />
    </section>
  );
}
