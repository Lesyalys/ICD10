// src/screens/ConsultantScreen.tsx
import { useState } from "react";
import { findTemplates, type ConsultantResult } from "../DB/consultant.ts";

type Props = {
  onBack: () => void;
  onOpenCard?: (icd10Id: number) => void;
};

const EXAMPLES = [
  "Боль в горле, температура 38, налет на миндалинах",
  "Боль за грудиной, отдаёт в левую руку, холодный пот",
  "Головная боль, тошнота, давление 180/100",
];

export default function ConsultantScreen({ onBack, onOpenCard }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConsultantResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(text?: string) {
    const q = (text ?? query).trim();
    if (q.length < 3) return;
    setQuery(q);
    setLoading(true);
    try {
      const data = await findTemplates(q);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="call-card">
      <header className="call-header call-card__header">
        <div className="call-card__header-inner">
          <div className="call-card__topbar">
            <button
              aria-label="Назад"
              className="call-card__back"
              onClick={onBack}
              type="button"
            >
              ←
            </button>
            <div className="call-card__brand">
              <p className="call-card__brand-top">Medic</p>
              <p className="call-card__brand-bottom">AI Консультант</p>
            </div>
            <span className="call-card__doc-icon">✦</span>
          </div>
          <h1 className="call-card__title">Подбор карты</h1>
          <p className="call-card__subtitle">
            Опишите жалобы и анамнез — найду подходящие карты из базы
          </p>

          <label className="call-card__search">
            <input
              className="call-card__search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Например: боль в горле, температура 38"
            />
          </label>
        </div>
      </header>

      <div className="call-card__body">
        {!results && (
          <div className="space-y-2">
            <p className="text-[12.5px] text-slate-500">Примеры:</p>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => search(ex)}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-[13px] text-[#173653] hover:bg-slate-50"
                type="button"
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="py-6 text-center text-[13px] text-slate-400">
            Ищу похожие карты…
          </p>
        )}

        {results && (
          <div>
            <p className="mb-3 text-[12.5px] text-slate-500">
              Найдено: {results.length}
            </p>
            <div className="space-y-3">
              {results.map((r) => (
                <button
                  key={r.templateId}
                  type="button"
                  onClick={() => r.icd10Id && onOpenCard?.(r.icd10Id)}
                  className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {r.mkbCode && (
                        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                          {r.mkbCode}
                        </p>
                      )}
                      <p className="mt-0.5 text-[14px] font-bold text-[#173653]">
                        {r.mkbName || "Без названия"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                      {(r.similarity * 100).toFixed(0)}%
                    </span>
                  </div>

                  {r.complaints && (
                    <p className="mt-2 line-clamp-2 text-[12.5px] text-slate-600">
                      <b>Жалобы:</b> {r.complaints}
                    </p>
                  )}
                  {r.anamnesis && (
                    <p className="mt-1 line-clamp-2 text-[12.5px] text-slate-600">
                      <b>Анамнез:</b> {r.anamnesis}
                    </p>
                  )}
                </button>
              ))}
              {results.length === 0 && (
                <p className="text-center text-[13px] text-slate-400">
                  Ничего похожего не найдено. Попробуйте описать симптомы иначе.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
