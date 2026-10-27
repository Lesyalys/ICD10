// src/screens/call-card/CallCardRecipesSection.tsx
import NarcoticForm from "../../components/NarcoticForm.tsx";
import type { MedicationView } from "../../utils/normalize.ts";

const EMPTY = "—";

type Props = {
  medications: MedicationView[];
  mkbCode: string | null;
  mkbName: string | null;
};

export default function CallCardRecipesSection({
  medications,
  mkbCode,
  mkbName,
}: Props) {
  const rows = medications.flatMap((m) =>
    m.tactics
      .filter((t) => t.recipe && t.recipe.trim())
      .map((t) => ({ med: m, tactic: t })),
  );

  return (
    <section className="call-card__section--block">
      <div className="call-card__section-head">
        <span className="call-card__section-icon call-card__section-icon--emerald">
          💊
        </span>
        <div>
          <h3 className="call-card__section-title">Рецепты</h3>
          <p className="call-card__section-sub">
            Бланки учёта НС/ПВ по данному вызову
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="call-card__empty-text-plain">{EMPTY}</p>
      ) : (
        <div className="call-card__recipe-list">
          {rows.map(({ med, tactic }) => (
            <NarcoticForm
              key={`${med.id}-${tactic.id}`}
              recipe={tactic.recipe}
              mkbCode={mkbCode}
              mkbName={mkbName}
            />
          ))}
        </div>
      )}
    </section>
  );
}
