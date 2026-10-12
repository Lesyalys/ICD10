import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../DB/supabase.js";
import { fetchTemplateForIcd10 } from "../DB/queries.ts";
import type { DiseaseTemplateFull } from "../DB/queries.ts";
import { flattenMedications } from "../utils/normalize.ts";
import MedicalField from "../components/MedicalField.tsx";
import MedicationsList from "../components/MedicationsList.tsx";
import TacticsList from "../components/TacticsList.tsx";
// import RecipesList from "../components/RecipesList.tsx";
import NarcoticForm from "../components/NarcoticForm.tsx";

const ICD10_FIELDS = "ID, MKB_CODE, MKB_NAME, ID_PARENT, REC_CODE";

type Icd10Item = {
  ID: number;
  MKB_CODE: string;
  MKB_NAME: string;
  ID_PARENT: string | null;
  REC_CODE: string;
};

async function fetchChildren(parentId: number | null): Promise<Icd10Item[]> {
  let builder = supabase
    .from("ICD10")
    .select(ICD10_FIELDS)
    .eq("ACTUAL", 1)
    .order("REC_CODE", { ascending: true })
    .order("MKB_CODE", { ascending: true });

  if (parentId === null) {
    builder = builder.is("ID_PARENT", null);
  } else {
    builder = builder.eq("ID_PARENT", String(parentId));
  }

  const { data, error } = await builder;
  if (error) {
    console.error("fetchChildren error:", error);
    return [];
  }
  return (data as Icd10Item[]) ?? [];
}

async function searchIcd10(query: string): Promise<Icd10Item[]> {
  const q = query.trim().replace(/[%_]/g, "");
  if (q.length < 2) return [];

  const { data, error } = await supabase
    .from("ICD10")
    .select(ICD10_FIELDS)
    .eq("ACTUAL", 1)
    .or(`MKB_CODE.ilike.%${q}%,MKB_NAME.ilike.%${q}%`)
    .order("MKB_CODE", { ascending: true })
    .limit(50);

  if (error) {
    console.error("searchIcd10 error:", error);
    return [];
  }
  return (data as Icd10Item[]) ?? [];
}

const EMPTY = "—";

export default function CallCardScreen({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");

  const [nodes, setNodes] = useState<Record<string, Icd10Item[]>>({});
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<number | "root">>(
    new Set(),
  );

  const [searchResults, setSearchResults] = useState<Icd10Item[]>([]);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<Icd10Item | null>(null);
  const [template, setTemplate] = useState<DiseaseTemplateFull | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const reqIdRef = useRef(0);
  const searchMode = query.trim().length >= 2;

  // --- Стартовая загрузка корней ---
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingNodes((s) => new Set(s).add("root"));
      const roots = await fetchChildren(null);
      if (!alive) return;
      setNodes((n) => ({ ...n, root: roots }));
      setLoadingNodes((s) => {
        const next = new Set(s);
        next.delete("root");
        return next;
      });
    })();
    return () => {
      alive = false;
    };
  }, []);

  // --- Debounce поиска ---
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const t = setTimeout(async () => {
      const myId = ++reqIdRef.current;
      setSearching(true);
      const data = await searchIcd10(q);
      if (myId !== reqIdRef.current) return;
      setSearchResults(data);
      setSearching(false);
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  async function toggleNode(item: Icd10Item) {
    const id = item.ID;

    if (expanded.has(id)) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    if (!nodes[id]) {
      setLoadingNodes((s) => new Set(s).add(id));
      const children = await fetchChildren(id);
      setLoadingNodes((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });

      setNodes((n) => ({ ...n, [id]: children }));

      if (children.length === 0) {
        handlePickLeaf(item);
        return;
      }
    } else if (nodes[id].length === 0) {
      handlePickLeaf(item);
      return;
    }

    setExpanded((prev) => new Set(prev).add(id));
  }

  // --- Загрузка шаблона для выбранного ICD10 ---
  async function loadTemplateFor(item: Icd10Item) {
    setSelected(item);
    setTemplate(null);
    setLoadingTemplate(true);
    const tpl = await fetchTemplateForIcd10(item.ID);
    setTemplate(tpl);
    setLoadingTemplate(false);
  }

  async function handlePickLeaf(item: Icd10Item) {
    await loadTemplateFor(item);
  }

  async function handlePickFromSearch(item: Icd10Item) {
    await loadTemplateFor(item);
  }

  const cardFields = useMemo(
    () => ({
      complaints: template?.COMPLAINTS ?? "",
      anamnesis: template?.ANAMNESIS ?? "",
      objectively: template?.OBJECTIVELY ?? "",
      localStatus: template?.LOCAL_STATUS ?? "",
    }),
    [template],
  );

  const medications = useMemo(() => flattenMedications(template), [template]);

  function renderNode(item: Icd10Item, depth: number) {
    const id = item.ID;
    const isExpanded = expanded.has(id);
    const isLoading = loadingNodes.has(id);
    const children = nodes[id];

    return (
      <div key={id} className="border-b border-slate-100 last:border-0">
        <button
          className="group flex w-full items-center gap-3 p-4 text-left transition hover:bg-slate-50 active:bg-slate-100"
          onClick={() => toggleNode(item)}
          style={{ paddingLeft: 16 + depth * 16 }}
          type="button"
        >
          <span className="flex h-9 min-w-14 items-center justify-center rounded-lg bg-[#e8eff5] px-2 text-[13px] font-extrabold text-[#173653]">
            {item.MKB_CODE}
          </span>
          <span className="min-w-0 flex-1 text-[13.5px] font-semibold leading-snug text-[#263a4e]">
            {item.MKB_NAME}
          </span>
          {isLoading ? (
            <span className="text-xs text-slate-400">…</span>
          ) : (
            <span
              className={`shrink-0 text-slate-400 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          )}
        </button>

        {isExpanded && children && children.length > 0 && (
          <div className="bg-[#fafbfc]">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f2f5f7] text-[#13263c]">
      <header className="call-header text-white">
        <div className="mx-auto max-w-3xl px-5 pb-8 pt-6 sm:px-8">
          <div className="flex items-center justify-between">
            <button
              aria-label="Вернуться в меню"
              className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:bg-white/15 active:scale-95"
              onClick={onBack}
              type="button"
            >
              ←
            </button>
            <div className="text-center">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-white/55 uppercase">
                Medic
              </p>
              <p className="mt-1 text-sm font-semibold">Карты СМП</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80">
              📄
            </span>
          </div>

          <h1 className="mt-8 text-[28px] font-bold leading-tight tracking-[-0.025em]">
            Найти карту
          </h1>
          <p className="mt-1.5 text-sm text-white/55">
            Поиск по коду или наименованию МКБ-10
          </p>

          <label className="mt-5 flex h-14 items-center gap-3 rounded-xl bg-white px-4 text-[#13263c] shadow-[0_12px_35px_rgba(0,0,0,0.16)]">
            <input
              aria-label="Поиск по МКБ-10"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none placeholder:font-normal placeholder:text-slate-400"
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(null);
                setTemplate(null);
              }}
              placeholder="Например, I21 или инфаркт"
              type="search"
              value={query}
            />
            {query && (
              <button
                aria-label="Очистить поиск"
                className="text-xl leading-none text-slate-400"
                onClick={() => {
                  setQuery("");
                  setSelected(null);
                  setTemplate(null);
                }}
                type="button"
              >
                ×
              </button>
            )}
          </label>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 px-4 pb-14 pt-5 sm:px-8">
        {!selected && (
          <section>
            <div className="mb-2.5 flex items-center justify-between px-1">
              <h2 className="text-xs font-bold tracking-[0.1em] text-slate-400 uppercase">
                {searchMode
                  ? searching
                    ? "Поиск…"
                    : "Найдено"
                  : "Классы МКБ-10"}
              </h2>
              <span className="text-xs font-semibold text-slate-400">
                {searchMode ? searchResults.length : (nodes.root?.length ?? 0)}
              </span>
            </div>

            <p className="mb-3 px-1 text-[12px] leading-snug text-slate-400">
              {searchMode
                ? "Результаты поиска по коду и наименованию"
                : "Нажмите на класс, чтобы раскрыть, и выберите конкретный диагноз"}
            </p>

            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_rgba(20,42,65,0.06)]">
              {searchMode ? (
                searchResults.length ? (
                  searchResults.map((item) => (
                    <button
                      className="group flex w-full items-center gap-3 border-b border-slate-100 p-4 text-left transition last:border-0 hover:bg-slate-50 active:bg-slate-100"
                      key={item.ID}
                      onClick={() => handlePickFromSearch(item)}
                      type="button"
                    >
                      <span className="flex h-10 min-w-14 items-center justify-center rounded-lg bg-[#e8eff5] px-2 text-sm font-extrabold text-[#173653]">
                        {item.MKB_CODE}
                      </span>
                      <span className="min-w-0 flex-1 text-[14px] font-semibold leading-snug text-[#263a4e]">
                        {item.MKB_NAME}
                      </span>
                    </button>
                  ))
                ) : (
                  !searching && (
                    <div className="px-5 py-10 text-center">
                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        Ничего не найдено
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Проверьте код или наименование диагноза
                      </p>
                    </div>
                  )
                )
              ) : loadingNodes.has("root") && !nodes.root ? (
                <p className="px-5 py-6 text-sm text-slate-400">Загрузка…</p>
              ) : (
                (nodes.root ?? []).map((item) => renderNode(item, 0))
              )}
            </div>
          </section>
        )}

        {selected && (
          <article className="overflow-hidden rounded-2xl bg-white shadow-[0_6px_30px_rgba(20,42,65,0.08)]">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-[#173653] px-3 py-2 text-sm font-extrabold text-white">
                  {selected.MKB_CODE}
                </span>
                <div>
                  <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-600 uppercase">
                    Код выбран
                  </p>
                  <h2 className="mt-1 text-[17px] font-bold leading-snug tracking-[-0.01em]">
                    {selected.MKB_NAME}
                  </h2>
                </div>
              </div>
              <button
                className="mt-4 text-xs font-bold text-[#356181]"
                onClick={() => {
                  setSelected(null);
                  setTemplate(null);
                  setQuery("");
                }}
                type="button"
              >
                Изменить диагноз
              </button>
            </div>

            {/* Общие поля */}
            <section className="px-5 pb-1 pt-5">
              <div className="mb-1 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#e8eff5] text-[#24415e]">
                  📋
                </span>
                <h3 className="text-[15px] font-extrabold">Общие поля</h3>
              </div>

              {loadingTemplate ? (
                <p className="px-1 py-6 text-sm text-slate-400">
                  Загрузка шаблона…
                </p>
              ) : (
                <>
                  <MedicalField label="Жалобы">
                    {cardFields.complaints || EMPTY}
                  </MedicalField>
                  <MedicalField label="Анамнез заболевания">
                    {cardFields.anamnesis || EMPTY}
                  </MedicalField>
                  <MedicalField label="Объективно">
                    {cardFields.objectively || EMPTY}
                  </MedicalField>
                  <MedicalField label="Локальный статус">
                    {cardFields.localStatus || EMPTY}
                  </MedicalField>
                  {!template && (
                    <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
                      Шаблон для данного диагноза не заполнен в базе.
                    </p>
                  )}
                </>
              )}
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
            {/* Рецепты — бланки НС/ПВ */}
            <section className="border-t-[7px] border-[#f2f5f7] px-5 py-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  💊
                </span>
                <div>
                  <h3 className="text-[15px] font-extrabold">Рецепты</h3>
                  <p className="text-[11px] text-slate-400">
                    Бланки учёта НС/ПВ по данному вызову
                  </p>
                </div>
              </div>

              {medications.filter((m) => m.recipe?.trim()).length === 0 ? (
                <p className="text-[13px] text-slate-400">{EMPTY}</p>
              ) : (
                <div className="space-y-4">
                  {medications
                    .filter((m) => m.recipe?.trim())
                    .map((m) => (
                      <NarcoticForm
                        key={m.id}
                        recipe={m.recipe}
                        mkbCode={selected?.MKB_CODE ?? null}
                        mkbName={selected?.MKB_NAME ?? null}
                      />
                    ))}
                </div>
              )}
            </section>
          </article>
        )}
      </div>
    </main>
  );
}
