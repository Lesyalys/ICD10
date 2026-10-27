// src/screens/call-card/CallCardTemplateSection.tsx
import MedicalField from "../../components/MedicalField.tsx";
import EditableField from "../../components/EditableField.tsx";
import type { TemplateDraft } from "./types.ts";

type Props = {
  isEditing: boolean;
  loading: boolean;
  hasTemplate: boolean;
  fields: {
    complaints: string;
    anamnesis: string;
    objectively: string;
    localStatus: string;
  };
  draft: TemplateDraft;
  onDraftChange: (patch: Partial<TemplateDraft>) => void;
};

const EMPTY = "—";

export default function CallCardTemplateSection({
  isEditing,
  loading,
  hasTemplate,
  fields,
  draft,
  onDraftChange,
}: Props) {
  return (
    <section className="call-card__section">
      <div className="call-card__section-head call-card__section-head--compact">
        <span className="call-card__section-icon">📋</span>
        <h3 className="call-card__section-title">Общие поля</h3>
      </div>

      {loading ? (
        <p className="call-card__loading">Загрузка шаблона…</p>
      ) : isEditing ? (
        <>
          <EditableField
            label="Жалобы"
            value={draft.COMPLAINTS}
            onChange={(v) => onDraftChange({ COMPLAINTS: v })}
          />
          <EditableField
            label="Анамнез заболевания"
            value={draft.ANAMNESIS}
            onChange={(v) => onDraftChange({ ANAMNESIS: v })}
          />
          <EditableField
            label="Объективно"
            value={draft.OBJECTIVELY}
            onChange={(v) => onDraftChange({ OBJECTIVELY: v })}
          />
          <EditableField
            label="Локальный статус"
            value={draft.LOCAL_STATUS}
            onChange={(v) => onDraftChange({ LOCAL_STATUS: v })}
          />
        </>
      ) : (
        <>
          <MedicalField label="Жалобы">
            {fields.complaints || EMPTY}
          </MedicalField>
          <MedicalField label="Анамнез заболевания">
            {fields.anamnesis || EMPTY}
          </MedicalField>
          <MedicalField label="Объективно">
            {fields.objectively || EMPTY}
          </MedicalField>
          <MedicalField label="Локальный статус">
            {fields.localStatus || EMPTY}
          </MedicalField>
          {!hasTemplate && (
            <p className="call-card__notice">
              Шаблон для данного диагноза не заполнен в базе.
            </p>
          )}
        </>
      )}
    </section>
  );
}
