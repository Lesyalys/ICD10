// src/components/TacticsList.tsx
import type { DiagnosisTactic } from "../DB/queries.ts";
import type { TacticsDrafts } from "../screens/call-card/types.ts";

const EMPTY = "—";

type Props = {
  tactics: DiagnosisTactic[];
  isEditing?: boolean;
  drafts?: TacticsDrafts;
  onDraftsChange?: (d: TacticsDrafts) => void;
};

export default function TacticsList({
  tactics,
  isEditing = false,
  drafts,
  onDraftsChange,
}: Props) {
  const hasNew = (drafts?.newTactics.length ?? 0) > 0;
  if (!tactics.length && !hasNew) {
    return <p className="text-[13px] text-slate-400">{EMPTY}</p>;
  }

  function updateText(linkId: number, text: string) {
    if (!drafts || !onDraftsChange) return;
    onDraftsChange({
      ...drafts,
      drafts: { ...drafts.drafts, [linkId]: { text } },
    });
  }

  function toggleDelete(linkId: number) {
    if (!drafts || !onDraftsChange) return;
    const exists = drafts.deletedTactics.includes(linkId);
    onDraftsChange({
      ...drafts,
      deletedTactics: exists
        ? drafts.deletedTactics.filter((x) => x !== linkId)
        : [...drafts.deletedTactics, linkId],
    });
  }

  function addNew() {
    if (!drafts || !onDraftsChange) return;
    onDraftsChange({
      ...drafts,
      newTactics: [
        ...drafts.newTactics,
        {
          tempId: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: "",
          priority: "",
        },
      ],
    });
  }

  function updateNew(tempId: string, text: string) {
    if (!drafts || !onDraftsChange) return;
    onDraftsChange({
      ...drafts,
      newTactics: drafts.newTactics.map((n) =>
        n.tempId === tempId ? { ...n, text } : n,
      ),
    });
  }

  function removeNew(tempId: string) {
    if (!drafts || !onDraftsChange) return;
    onDraftsChange({
      ...drafts,
      newTactics: drafts.newTactics.filter((n) => n.tempId !== tempId),
    });
  }

  return (
    <div className="space-y-3">
      {tactics.map((t) => {
        const deleted = drafts?.deletedTactics.includes(t.linkId);
        const text = drafts?.drafts[t.linkId]?.text ?? t.text;
        return (
          <div
            key={t.linkId}
            className={`rounded-xl border bg-white px-4 py-3 ${
              deleted ? "border-red-200 opacity-60" : "border-slate-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-[#356181]">
                Тактика #{t.linkId}
              </p>
              {isEditing && (
                <button
                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    deleted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                  onClick={() => toggleDelete(t.linkId)}
                  type="button"
                >
                  {deleted ? "Восстановить" : "Удалить"}
                </button>
              )}
            </div>
            {isEditing && !deleted ? (
              <textarea
                rows={3}
                value={text}
                onChange={(e) => updateText(t.linkId, e.target.value)}
                placeholder="Текст тактики"
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
              />
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[#263a4e]">
                {text}
              </p>
            )}
          </div>
        );
      })}

      {isEditing &&
        (drafts?.newTactics ?? []).map((n) => (
          <div
            key={n.tempId}
            className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-emerald-700">
                Новая тактика
              </p>
              <button
                className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600"
                onClick={() => removeNew(n.tempId)}
                type="button"
              >
                Убрать
              </button>
            </div>
            <textarea
              rows={3}
              value={n.text}
              onChange={(e) => updateNew(n.tempId, e.target.value)}
              placeholder="Текст тактики"
              className="mt-2 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px]"
            />
          </div>
        ))}

      {isEditing && (
        <button
          type="button"
          className="w-full rounded-lg border border-dashed border-emerald-400 bg-emerald-50 py-2 text-[12px] font-bold text-emerald-700 hover:bg-emerald-100"
          onClick={addNew}
        >
          + Добавить тактику
        </button>
      )}
    </div>
  );
}
