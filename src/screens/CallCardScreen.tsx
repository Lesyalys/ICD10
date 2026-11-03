// src/screens/CallCardScreen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../DB/supabase.ts";
import { useToast } from "../components/toast.ts";
import EditorLogin from "./EditorLogin.tsx";
import MedicationEditorModal from "../components/MedicationEditorModal.tsx";
import {
  emptyDraftsState as emptyDraftMeds,
  type DraftsState,
} from "../components/EditableMedicationsList.tsx";
import {
  fetchTemplateById,
  fetchSmpByIcd10Id,
  ensureSmpCard,
  fetchSmpChildren,
  searchSmpIcd10,
  fetchSmpParentIdsWithChildren,
  fetchMedicationsForIcd10,
  updateDiseaseTemplate,
  createMedicationForIcd10,
  linkExistingMedicationWithTactic,
  updateTactik,
  updateLinkTactikText,
  unlinkTactic,
  unlinkMedicationFromIcd10,
} from "../DB/queries.ts";
import type { DiseaseTemplateFull, AtxNode, SmpIcd10 } from "../DB/queries.ts";
import { flattenMedications } from "../utils/normalize.ts";

import CallCardHeader from "./call-card/CallCardHeader.tsx";
import CallCardMkbTree from "./call-card/CallCardMkbTree.tsx";
import CallCardDiagnosis from "./call-card/CallCardDiagnosis.tsx";
import CallCardTemplateSection from "./call-card/CallCardTemplateSection.tsx";
import CallCardMedicationsSection from "./call-card/CallCardMedicationsSection.tsx";
import CallCardTacticsSection from "./call-card/CallCardTacticsSection.tsx";
import CallCardRecipesSection from "./call-card/CallCardRecipesSection.tsx";
import type { Icd10Item, TemplateDraft } from "./call-card/types.ts";

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
  const [smp, setSmp] = useState<SmpIcd10 | null>(null);
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

  // Модалка редактирования карточки препарата (ATX_AMBULANCE)
  const [editMed, setEditMed] = useState<{
    id: number;
    name: string | null;
    unit: string | null;
    content: string | null;
    recipe: string | null;
  } | null>(null);

  const reqIdRef = useRef(0);
  const searchMode = query.trim().length >= 2;
  const { notify } = useToast();

  // --- Загрузка корней ICD10 ---
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingNodes((s) => new Set(s).add("root"));
      const [roots, parents] = await Promise.all([
        fetchSmpChildren(null),
        fetchSmpParentIdsWithChildren(),
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
      const data = await searchSmpIcd10(q);
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
    if (!selected) return;

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setEditorLoginOpen(true);
      return;
    }

    // Диагноз обязан существовать в SMP_ICD10 — создаём запись и шаблон при отсутствии
    if (!smp || !template) {
      const ensured = await ensureSmpCard(selected.ID);
      if (!ensured) {
        notify("Не удалось добавить диагноз в базу СМП", "error");
        return;
      }
      setSmp(ensured.smp);
      setTemplate(ensured.template);
      setDraftTemplate(templateToDraft(ensured.template));
    }

    setIsEditing(true);
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
      const children = await fetchSmpChildren(id);
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
    setSmp(null);
    setTemplate(null);
    setMedicationsRaw([]);
    setLoadingTemplate(true);
    setIsEditing(false);
    setDraftMeds(emptyDraftMeds);
    setDraftTemplate(emptyTemplateDraft);
    setPickedMed(null);
    setCreateBlank(false);
    setPickerOpen(false);
    setEditMed(null);

    const [smpRec, meds] = await Promise.all([
      fetchSmpByIcd10Id(item.ID),
      fetchMedicationsForIcd10(item.ID),
    ]);
    setSmp(smpRec);

    let tpl: DiseaseTemplateFull | null = null;
    if (smpRec?.DISEASE_TEMPLATES_ID) {
      tpl = await fetchTemplateById(Number(smpRec.DISEASE_TEMPLATES_ID));
    }
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

  // Перечитать препараты после сохранения карточки из модалки
  async function reloadMedications() {
    if (!selected) return;
    const meds = await fetchMedicationsForIcd10(selected.ID);
    setMedicationsRaw(meds);
  }

  function handleQueryChange(v: string) {
    setQuery(v);
    setSelected(null);
    setSmp(null);
    setTemplate(null);
    setMedicationsRaw([]);
    setIsEditing(false);
  }
  function handleClearQuery() {
    handleQueryChange("");
  }
  function handleChangeDiagnosis() {
    setSelected(null);
    setSmp(null);
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
      // 1) Диагноз в SMP_ICD10 + шаблон (обеспечиваем наличие)
      let tpl = template;
      if (!smp || !tpl) {
        const ensured = await ensureSmpCard(selected.ID);
        if (!ensured) throw new Error("Не удалось добавить диагноз в базу СМП");
        setSmp(ensured.smp);
        tpl = ensured.template;
        setTemplate(tpl);
      }

      // Шаблон
      if (tpl) {
        const patch: Partial<
          Pick<
            DiseaseTemplateFull,
            "COMPLAINTS" | "ANAMNESIS" | "OBJECTIVELY" | "LOCAL_STATUS"
          >
        > = {};
        if (draftTemplate.COMPLAINTS !== (tpl.COMPLAINTS ?? ""))
          patch.COMPLAINTS = draftTemplate.COMPLAINTS;
        if (draftTemplate.ANAMNESIS !== (tpl.ANAMNESIS ?? ""))
          patch.ANAMNESIS = draftTemplate.ANAMNESIS;
        if (draftTemplate.OBJECTIVELY !== (tpl.OBJECTIVELY ?? ""))
          patch.OBJECTIVELY = draftTemplate.OBJECTIVELY;
        if (draftTemplate.LOCAL_STATUS !== (tpl.LOCAL_STATUS ?? ""))
          patch.LOCAL_STATUS = draftTemplate.LOCAL_STATUS;
        if (Object.keys(patch).length > 0) {
          const ok = await updateDiseaseTemplate(tpl.ID, patch);
          if (!ok) throw new Error("Не удалось сохранить шаблон");
        }
      }

      // 2) Удаление тактик (текст живёт в строке связи — удаляем по linkId)
      for (const del of draftMeds.deletedTactics) {
        const med = medications.find((x) => x.id === del.medId);
        if (!med) continue;
        const tactic = med.tactics.find((x) => x.linkId === del.linkId);
        const res = await unlinkTactic(del.linkId, tactic?.id ?? null);
        if (!res.ok) {
          throw new Error(
            `Не удалось удалить тактику ${del.linkId}: ${res.error ?? "unknown"}`,
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
              (x) => x.medId === m.id && x.linkId === t.linkId,
            )
          ) {
            continue;
          }
          const d = medDraft.tactics[t.linkId];
          if (!d) continue;

          const doseA = d.doseA.trim() === "" ? null : Number(d.doseA);
          const doseC = d.doseC.trim() === "" ? null : Number(d.doseC);

          // Текст тактики — в строке связи DIAGNOSIS_MEDICATION_TACTIC
          if (d.text !== (t.text ?? "")) {
            const ok = await updateLinkTactikText(t.linkId, d.text || null);
            if (!ok)
              throw new Error(`Не удалось сохранить текст тактики ${t.id}`);
          }

          // Остальные поля — в справочнике TACTIK
          const patch: Record<string, any> = {};
          if (d.routes !== (t.routes ?? "")) patch.ROUTES = d.routes || null;
          if (d.condition !== (t.condition ?? ""))
            patch.CONDITION = d.condition || null;
          if (doseA !== t.doseA) patch.DOSE_A = doseA;
          if (doseC !== t.doseC) patch.DOSE_C = doseC;
          // if (d.next !== (t.next ?? "")) patch.NEXT_TACTIK = d.next || null;
          if (d.priority !== (t.priority ?? ""))
            patch.PRIORITY = d.priority || null;

          if (Object.keys(patch).length > 0) {
            const ok = await updateTactik(t.id, patch as any);
            if (!ok) throw new Error(`Не удалось сохранить тактику ${t.id}`);
          }
        }
      }

      // 5) Новые тактики к существующим препаратам
      for (const [medIdStr, list] of Object.entries(draftMeds.newTactics)) {
        const medId = Number(medIdStr);
        if (draftMeds.deletedMeds.includes(medId)) continue;

        for (const nt of list) {
          const doseA = nt.doseA.trim() === "" ? null : Number(nt.doseA);
          const doseC = nt.doseC.trim() === "" ? null : Number(nt.doseC);

          const res = await linkExistingMedicationWithTactic(
            selected.ID,
            medId,
            {
              TACTIK_TEXT: nt.text || null,
              ROUTES: nt.routes || null,
              CONDITION: nt.condition || null,
              DOSE_A: doseA,
              DOSE_C: doseC,
              // NEXT_TACTIK: nt.next || null,
              PRIORITY: nt.priority || null,
            },
          );
          if (!res.ok) {
            throw new Error(
              `Не удалось добавить тактику к препарату ${medId}: ${res.error ?? "unknown"}`,
            );
          }
        }
      }

      // 6) Новые препараты
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
              // NEXT_TACTIK: t.next || null,
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
            RECIPE: n.recipe.trim() || null,
            TACTIK_TEXT: t.text || null,
            ROUTES: t.routes || null,
            CONDITION: t.condition || null,
            DOSE_A: doseA,
            DOSE_C: doseC,
            // NEXT_TACTIK: t.next || null,
            PRIORITY: t.priority || null,
          });
          if (!created) {
            throw new Error(`Не удалось создать препарат "${n.name}"`);
          }
        }
      }

      // 7) Перечитать
      const [smpRec, meds] = await Promise.all([
        fetchSmpByIcd10Id(selected.ID),
        fetchMedicationsForIcd10(selected.ID),
      ]);
      setSmp(smpRec);

      const reloadedTpl = smpRec?.DISEASE_TEMPLATES_ID
        ? await fetchTemplateById(Number(smpRec.DISEASE_TEMPLATES_ID))
        : null;
      setTemplate(reloadedTpl);
      setMedicationsRaw(meds);
      setDraftTemplate(templateToDraft(reloadedTpl));
      setDraftMeds(emptyDraftMeds);
      setPickedMed(null);
      setCreateBlank(false);
      setIsEditing(false);
    } catch (err) {
      console.error("save error:", err);
      notify("Ошибка сохранения. Подробности в консоли.", "error");
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

  // Пояснение под общими полями: статуса диагноза в SMP_ICD10
  const templateNotice = useMemo(() => {
    if (!smp)
      return "Диагноз ещё не в базе СМП. «Режим редактирования» добавит его.";
    if (!smp.is_active) return "Диагноз отключён в базе СМП.";
    if (!template) return "Шаблон для данного диагноза не заполнен в базе.";
    return null;
  }, [smp, template]);

  return (
    <main className="call-card">
      {editorLoginOpen && (
        <EditorLogin
          onSuccess={() => {
            setEditorLoginOpen(false);
            void handleStartEditing();
          }}
          onCancel={() => setEditorLoginOpen(false)}
        />
      )}

      {editMed && (
        <MedicationEditorModal
          medId={editMed.id}
          initial={{
            NAME: editMed.name,
            UNIT: editMed.unit,
            CONTENT: editMed.content,
            RECIPE: editMed.recipe,
          }}
          open
          onClose={() => setEditMed(null)}
          onSaved={() => {
            void reloadMedications();
            notify("Препарат сохранён", "success");
          }}
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
              notice={templateNotice}
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
              onEditMedication={setEditMed}
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

            <CallCardTacticsSection
              medications={medications}
              isEditing={isEditing}
              draftMeds={draftMeds}
              onDraftMedsChange={setDraftMeds}
            />

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
