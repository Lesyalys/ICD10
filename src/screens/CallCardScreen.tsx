// src/screens/CallCardScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../DB/supabase.js";
import EditorLogin from "./EditorLogin.tsx";
import {
  emptyDraftsState as emptyDraftMeds,
  type DraftsState,
} from "../components/EditableMedicationsList.tsx";
import {
  fetchTemplateForIcd10,
  fetchMedicationsForIcd10,
  fetchParentIdsWithChildren,
  updateDiseaseTemplate,
  createMedicationForIcd10,
  linkExistingMedicationWithTactic,
  updateTactik,
  unlinkTactic,
  unlinkMedicationFromIcd10,
} from "../DB/queries.ts";
import type { DiseaseTemplateFull, AtxNode } from "../DB/queries.ts";
import { flattenMedications } from "../utils/normalize.ts";

import CallCardHeader from "./call-card/CallCardHeader.tsx";
import CallCardMkbTree from "./call-card/CallCardMkbTree.tsx";
import CallCardDiagnosis from "./call-card/CallCardDiagnosis.tsx";
import CallCardTemplateSection from "./call-card/CallCardTemplateSection.tsx";
import CallCardMedicationsSection from "./call-card/CallCardMedicationsSection.tsx";
import CallCardTacticsSection from "./call-card/CallCardTacticsSection.tsx";
import CallCardRecipesSection from "./call-card/CallCardRecipesSection.tsx";
import type { Icd10Item, TemplateDraft } from "./call-card/types.ts";

const ICD10_FIELDS = "ID, MKB_CODE, MKB_NAME, ID_PARENT, REC_CODE";

const emptyTemplateDraft: TemplateDraft = {
  COMPLAINTS: "",
  ANAMNESIS: "",
  OBJECTIVELY: "",
  LOCAL_STATUS: "",
};

function templateToDraft(tpl: DiseaseTemplateFull | null): TemplateDraft {
  return {
    COMPLAINTS: tpl?.COMPLAINTS ?? "",
    ANAMNESIS: tpl?.ANAMNESIS ?? "",
    OBJECTIVELY: tpl?.OBJECTIVELY ?? "",
    LOCAL_STATUS: tpl?.LOCAL_STATUS ?? "",
  };
}

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

export default function CallCardScreen({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState("");
  const [nodes, setNodes] = useState<Record<string, Icd10Item[]>>({});
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<number | "root">>(
    new Set(),
  );
  const [parentIds, setParentIds] = useState<Set<number>>(new Set());
  const [parentIdsLoaded, setParentIdsLoaded] = useState(false);
  const [searchResults, setSearchResults] = useState<Icd10Item[]>([]);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] = useState<Icd10Item | null>(null);
  const [template, setTemplate] = useState<DiseaseTemplateFull | null>(null);
  const [medicationsRaw, setMedicationsRaw] = useState<
    Awaited<ReturnType<typeof fetchMedicationsForIcd10>> | []
  >([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [createBlank, setCreateBlank] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedMed, setPickedMed] = useState<AtxNode | null>(null);
  const [saving, setSaving] = useState(false);
  const [draftTemplate, setDraftTemplate] =
    useState<TemplateDraft>(emptyTemplateDraft);
  const [draftMeds, setDraftMeds] = useState<DraftsState>(emptyDraftMeds);

  // ← ДОБАВЛЕНО: модалка логина
  const [editorLoginOpen, setEditorLoginOpen] = useState(false);

  const reqIdRef = useRef(0);
  const searchMode = query.trim().length >= 2;

  // --- Загрузка корней ICD10 ---
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingNodes((s) => new Set(s).add("root"));
      const [roots, parents] = await Promise.all([
        fetchChildren(null),
        fetchParentIdsWithChildren(),
      ]);
      if (!alive) return;
      setNodes((n) => ({ ...n, root: roots }));
      setParentIds(parents);
      setParentIdsLoaded(true);
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

  // --- Поиск ---
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

  const medications = useMemo(
    () => flattenMedications(medicationsRaw as any),
    [medicationsRaw],
  );

  // --- Клик «Режим редактирования»: проверяем сессию ---
  async function handleStartEditing() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setIsEditing(true);
    } else {
      setEditorLoginOpen(true);
    }
  }

  async function toggleNode(item: Icd10Item) {
    const id = item.ID;
    if (parentIdsLoaded && !parentIds.has(id)) {
      handlePick(item);
      return;
    }
    if (expanded.has(id)) {
      setExpanded((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      return;
    }
    if (!nodes[id]) {
      setLoadingNodes((s) => new Set(s).add(id));
      const children = await fetchChildren(id);
      setLoadingNodes((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      setNodes((n) => ({ ...n, [id]: children }));
      if (children.length === 0) {
        handlePick(item);
        return;
      }
    } else if (nodes[id].length === 0) {
      handlePick(item);
      return;
    }
    setExpanded((prev) => new Set(prev).add(id));
  }

  async function loadTemplateFor(item: Icd10Item) {
    setSelected(item);
    setTemplate(null);
    setMedicationsRaw([]);
    setLoadingTemplate(true);
    setIsEditing(false);
    setDraftMeds(emptyDraftMeds);
    setDraftTemplate(emptyTemplateDraft);
    setPickedMed(null);
    setCreateBlank(false);
    setPickerOpen(false);

    const [tpl, meds] = await Promise.all([
      fetchTemplateForIcd10(item.ID),
      fetchMedicationsForIcd10(item.ID),
    ]);
    setTemplate(tpl);
    setMedicationsRaw(meds);
    setDraftTemplate(templateToDraft(tpl));
    setLoadingTemplate(false);
  }

  async function handlePick(item: Icd10Item) {
    await loadTemplateFor(item);
  }

  function resetEditing() {
    setDraftTemplate(templateToDraft(template));
    setDraftMeds(emptyDraftMeds);
    setPickedMed(null);
    setCreateBlank(false);
    setPickerOpen(false);
    setIsEditing(false);
  }

  function handleQueryChange(v: string) {
    setQuery(v);
    setSelected(null);
    setTemplate(null);
    setMedicationsRaw([]);
    setIsEditing(false);
  }
  function handleClearQuery() {
    handleQueryChange("");
  }
  function handleChangeDiagnosis() {
    setSelected(null);
    setTemplate(null);
    setMedicationsRaw([]);
    setIsEditing(false);
    setQuery("");
  }

  function handlePickExisting(med: AtxNode) {
    if (med.LEVEL !== 2) {
      console.warn("[picker] не препарат:", med);
      return;
    }
    setPickedMed(med);
    setPickerOpen(false);
  }
  function handleCreateNew() {
    setCreateBlank(true);
    setPickerOpen(false);
  }
  function consumeExternal() {
    setPickedMed(null);
    setCreateBlank(false);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      // 1) Шаблон
      if (template) {
        const patch: Partial<
          Pick<
            DiseaseTemplateFull,
            "COMPLAINTS" | "ANAMNESIS" | "OBJECTIVELY" | "LOCAL_STATUS"
          >
        > = {};
        if (draftTemplate.COMPLAINTS !== (template.COMPLAINTS ?? ""))
          patch.COMPLAINTS = draftTemplate.COMPLAINTS;
        if (draftTemplate.ANAMNESIS !== (template.ANAMNESIS ?? ""))
          patch.ANAMNESIS = draftTemplate.ANAMNESIS;
        if (draftTemplate.OBJECTIVELY !== (template.OBJECTIVELY ?? ""))
          patch.OBJECTIVELY = draftTemplate.OBJECTIVELY;
        if (draftTemplate.LOCAL_STATUS !== (template.LOCAL_STATUS ?? ""))
          patch.LOCAL_STATUS = draftTemplate.LOCAL_STATUS;
        if (Object.keys(patch).length > 0) {
          const ok = await updateDiseaseTemplate(template.ID, patch);
          if (!ok) throw new Error("Не удалось сохранить шаблон");
        }
      }

      // 2) Удаление тактик
      for (const del of draftMeds.deletedTactics) {
        const med = medications.find((x) => x.id === del.medId);
        if (!med) continue;
        const sourceId = med.icd10Id ?? selected.ID;
        const res = await unlinkTactic(sourceId, del.medId, del.tactikId);
        if (!res.ok) {
          throw new Error(
            `Не удалось удалить тактику ${del.tactikId}: ${res.error ?? "unknown"}`,
          );
        }
      }

      // 3) Удаление препаратов
      for (const medId of draftMeds.deletedMeds) {
        const med = medications.find((x) => x.id === medId);
        if (!med) continue;
        const sourceId = med.icd10Id ?? selected.ID;
        const res = await unlinkMedicationFromIcd10(sourceId, medId);
        if (!res.ok) {
          throw new Error(
            `Не удалось удалить препарат ${medId}: ${res.error ?? "unknown"}`,
          );
        }
      }

      // 4) Обновление существующих тактик
      for (const m of medications) {
        if (draftMeds.deletedMeds.includes(m.id)) continue;
        const medDraft = draftMeds.drafts[m.id];
        if (!medDraft) continue;

        for (const t of m.tactics) {
          if (
            draftMeds.deletedTactics.some(
              (x) => x.medId === m.id && x.tactikId === t.id,
            )
          ) {
            continue;
          }
          const d = medDraft.tactics[t.id];
          if (!d) continue;

          const doseA = d.doseA.trim() === "" ? null : Number(d.doseA);
          const doseC = d.doseC.trim() === "" ? null : Number(d.doseC);

          const patch: Record<string, any> = {};
          if (d.text !== (t.text ?? "")) patch.TACTIK_TEXT = d.text || null;
          if (d.routes !== (t.routes ?? "")) patch.ROUTES = d.routes || null;
          if (d.condition !== (t.condition ?? ""))
            patch.CONDITION = d.condition || null;
          if (doseA !== t.doseA) patch.DOSE_A = doseA;
          if (doseC !== t.doseC) patch.DOSE_C = doseC;
          if (d.recipe !== (t.recipe ?? "")) patch.RECIPE = d.recipe || null;
          if (d.next !== (t.next ?? "")) patch.NEXT_TACTIK = d.next || null;
          if (d.priority !== (t.priority ?? ""))
            patch.PRIORITY = d.priority || null;

          if (Object.keys(patch).length > 0) {
            const ok = await updateTactik(t.id, patch as any);
            if (!ok) throw new Error(`Не удалось сохранить тактику ${t.id}`);
          }
        }
      }

      // 5) Новые препараты / новые тактики
      for (const n of draftMeds.newMeds) {
        const t = n.tactic;
        const doseA = t.doseA.trim() === "" ? null : Number(t.doseA);
        const doseC = t.doseC.trim() === "" ? null : Number(t.doseC);

        if (n.existingId) {
          const res = await linkExistingMedicationWithTactic(
            selected.ID,
            n.existingId,
            {
              TACTIK_TEXT: t.text || null,
              ROUTES: t.routes || null,
              CONDITION: t.condition || null,
              DOSE_A: doseA,
              DOSE_C: doseC,
              RECIPE: t.recipe || null,
              NEXT_TACTIK: t.next || null,
              PRIORITY: t.priority || null,
            },
          );
          if (!res.ok) {
            throw new Error(
              `Не удалось добавить тактику к препарату ${n.existingId}: ${res.error ?? "unknown"}`,
            );
          }
        } else {
          if (!n.name.trim()) continue;
          const created = await createMedicationForIcd10(selected.ID, {
            NAME: n.name.trim(),
            UNIT: n.unit.trim() || null,
            CONTENT: n.content.trim() || null,
            TACTIK_TEXT: t.text || null,
            ROUTES: t.routes || null,
            CONDITION: t.condition || null,
            DOSE_A: doseA,
            DOSE_C: doseC,
            RECIPE: t.recipe || null,
            NEXT_TACTIK: t.next || null,
            PRIORITY: t.priority || null,
          });
          if (!created) {
            throw new Error(`Не удалось создать препарат "${n.name}"`);
          }
        }
      }

      // 6) Перечитать
      const [tpl, meds] = await Promise.all([
        fetchTemplateForIcd10(selected.ID),
        fetchMedicationsForIcd10(selected.ID),
      ]);
      setTemplate(tpl);
      setMedicationsRaw(meds);
      setDraftTemplate(templateToDraft(tpl));
      setDraftMeds(emptyDraftMeds);
      setPickedMed(null);
      setCreateBlank(false);
      setIsEditing(false);
    } catch (err) {
      console.error("save error:", err);
      alert("Ошибка сохранения. Подробности в консоли.");
    } finally {
      setSaving(false);
    }
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

  return (
    <main className="call-card">
      {editorLoginOpen && (
        <EditorLogin
          onSuccess={() => {
            setEditorLoginOpen(false);
            setIsEditing(true);
          }}
          onCancel={() => setEditorLoginOpen(false)}
        />
      )}

      <CallCardHeader
        query={query}
        onQueryChange={handleQueryChange}
        onClear={handleClearQuery}
        onBack={onBack}
      />

      <div className="call-card__body">
        {!selected && (
          <CallCardMkbTree
            searchMode={searchMode}
            searching={searching}
            searchResults={searchResults}
            rootNodes={nodes.root ?? []}
            rootLoading={loadingNodes.has("root") && !nodes.root}
            parentIdsLoaded={parentIdsLoaded}
            parentIds={parentIds}
            expanded={expanded}
            nodes={nodes}
            loadingNodes={loadingNodes}
            onToggle={toggleNode}
            onPickFromSearch={handlePick}
            onOpenGroup={handlePick}
          />
        )}

        {selected && (
          <article className="call-card__card">
            <CallCardDiagnosis
              code={selected.MKB_CODE}
              name={selected.MKB_NAME}
              onChangeDiagnosis={handleChangeDiagnosis}
            />

            <CallCardTemplateSection
              isEditing={isEditing}
              loading={loadingTemplate}
              hasTemplate={!!template}
              fields={cardFields}
              draft={draftTemplate}
              onDraftChange={(patch) =>
                setDraftTemplate((s) => ({ ...s, ...patch }))
              }
            />

            <CallCardMedicationsSection
              medications={medications}
              isEditing={isEditing}
              saving={saving}
              pickerOpen={pickerOpen}
              pickedMed={pickedMed}
              createBlank={createBlank}
              currentIcd10Id={selected.ID}
              draftMeds={draftMeds}
              onDraftMedsChange={setDraftMeds}
              onRequestPicker={() => setPickerOpen(true)}
              onPickExisting={handlePickExisting}
              onCreateNew={handleCreateNew}
              onClosePicker={() => setPickerOpen(false)}
              onConsumeExternal={consumeExternal}
              onEditStart={handleStartEditing}
              onSave={handleSave}
              onCancel={resetEditing}
            />

            <CallCardTacticsSection medications={medications} />

            <CallCardRecipesSection
              medications={medications}
              mkbCode={selected.MKB_CODE}
              mkbName={selected.MKB_NAME}
            />
          </article>
        )}
      </div>
    </main>
  );
}
