// src/screens/call-card/CallCardTacticsSection.tsx
import TacticsListWithCalculator from "../../components/TacticsListWithCalculator.tsx";
import type { MedicationView } from "../../utils/normalize.ts";

export default function CallCardTacticsSection({
  medications,
}: {
  medications: MedicationView[];
}) {
  return (
    <section className="call-card__section--block">
      <div className="call-card__section-head">
        <span className="call-card__section-icon call-card__section-icon--amber">
          ❤️
        </span>
        <div>
          <h3 className="call-card__section-title">Тактика</h3>
          <p className="call-card__section-sub">
            Дозы и рекомендации по применению
          </p>
        </div>
      </div>
      <TacticsListWithCalculator items={medications} />
    </section>
  );
}
