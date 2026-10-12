import type { MedicationView } from "../utils/normalize.ts";

const EMPTY = "—";

export default function RecipesList({ items }: { items: MedicationView[] }) {
  const rows = items.filter((m) => m.recipe && m.recipe.trim().length > 0);

  if (!rows.length) {
    return <p className="text-[13px] text-slate-400">{EMPTY}</p>;
  }

  return (
    <ul className="space-y-2">
      {rows.map((m) => (
        <li
          key={m.id}
          className="rounded-xl border border-slate-100 bg-[#f7f9fa] px-4 py-3"
        >
          <p className="whitespace-pre-wrap font-serif text-[14px] italic text-[#173653]">
            {m.recipe}
          </p>
          {m.atcName && (
            <p className="mt-1 text-[11px] text-slate-400">{m.atcName}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
