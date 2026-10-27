// src/components/RecipesList.tsx
import type { MedicationView } from "../utils/normalize.ts";

const EMPTY = "—";

export default function RecipesList({ items }: { items: MedicationView[] }) {
  const rows = items.flatMap((m) =>
    m.tactics
      .filter((t) => t.recipe && t.recipe.trim())
      .map((t) => ({ med: m, tactic: t })),
  );

  if (!rows.length) {
    return <p className="text-[13px] text-slate-400">{EMPTY}</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map(({ med, tactic }) => (
        <li
          key={`${med.id}-${tactic.id}`}
          className="rounded-xl border border-slate-100 bg-[#f7f9fa] px-4 py-3"
        >
          <p className="whitespace-pre-wrap font-serif text-[14px] italic text-[#173653]">
            {tactic.recipe}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            {med.name}
            {tactic.routes ? ` · ${tactic.routes}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
