import TacticsList from "../../components/TacticsList.tsx";
import type { DiagnosisTactic } from "../../DB/queries.ts";
import type { TacticsDrafts } from "./types.ts";

export default function CallCardTacticsSection({
  tactics,
  isEditing,
  drafts,
  onDraftsChange,
}: {
  tactics: DiagnosisTactic[];
  isEditing: boolean;
  drafts: TacticsDrafts;
  onDraftsChange: (d: TacticsDrafts) => void;
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
        tactics={tactics}
        isEditing={isEditing}
        drafts={drafts}
        onDraftsChange={onDraftsChange}
      />
    </section>
  );
}
