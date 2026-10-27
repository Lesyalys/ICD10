// src/screens/call-card/CallCardMedicationsSection.tsx
import MedicationsList from "../../components/MedicationsList.tsx";
import EditableMedicationsList from "../../components/EditableMedicationsList.tsx";
import AddMedicationPicker from "../../components/AddMedicationPicker.tsx";
import type { DraftsState } from "../../components/EditableMedicationsList.tsx";
import type { AtxNode } from "../../DB/queries.ts";
import type { MedicationView } from "../../utils/normalize.ts";

type Props = {
  draftMeds: DraftsState;
  onDraftMedsChange: (s: DraftsState) => void;
  medications: MedicationView[];
  isEditing: boolean;
  saving: boolean;
  pickerOpen: boolean;
  pickedMed: AtxNode | null;
  createBlank: boolean;
  currentIcd10Id: number;
  onRequestPicker: () => void;
  onPickExisting: (m: AtxNode) => void;
  onCreateNew: () => void;
  onClosePicker: () => void;
  onConsumeExternal: () => void;
  onEditStart: () => void;
  onSave: () => void;
  onCancel: () => void;
};

export default function CallCardMedicationsSection(props: Props) {
  const {
    medications,
    isEditing,
    saving,
    pickerOpen,
    pickedMed,
    createBlank,
    draftMeds,
    onDraftMedsChange,
    onRequestPicker,
    onPickExisting,
    onCreateNew,
    onClosePicker,
    onConsumeExternal,
    onEditStart,
    onSave,
    onCancel,
  } = props;

  return (
    <section className="call-card__section--block">
      <div className="call-card__section-head">
        <span className="call-card__section-icon call-card__section-icon--blue">
          ⚕️
        </span>
        <div className="flex-1">
          <h3 className="call-card__section-title">Лекарства</h3>
          <p className="call-card__section-sub">
            {isEditing
              ? "Добавляйте, удаляйте и редактируйте препараты"
              : "Рекомендованные препараты"}
          </p>
        </div>

        <div className="call-card__actions">
          {!isEditing && (
            <button
              className="call-card__btn-edit"
              onClick={onEditStart}
              type="button"
            >
              Режим редактирования
            </button>
          )}
          {isEditing && (
            <>
              <button
                className="call-card__btn-save"
                onClick={onSave}
                disabled={saving}
                type="button"
              >
                {saving ? "Сохранение…" : "Сохранить"}
              </button>
              <button
                className="call-card__btn-cancel"
                onClick={onCancel}
                disabled={saving}
                type="button"
              >
                Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <>
          <EditableMedicationsList
            items={medications}
            isEditing
            onRequestPicker={onRequestPicker}
            pickedMed={pickedMed}
            createBlank={createBlank}
            onConsumeExternal={onConsumeExternal}
            onChange={onDraftMedsChange}
          />
          <AddMedicationPicker
            open={pickerOpen}
            alreadyLinkedIds={[
              ...medications.map((m) => m.id),
              ...draftMeds.newMeds
                .map((n) => n.existingId)
                .filter((x): x is number => x != null),
            ]}
            onPick={onPickExisting}
            onCreateNew={onCreateNew}
            onClose={onClosePicker}
          />
        </>
      ) : (
        <MedicationsList items={medications} />
      )}
    </section>
  );
}
