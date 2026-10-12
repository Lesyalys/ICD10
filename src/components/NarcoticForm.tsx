import { useMemo } from "react";

type Props = {
  /** Строка рецепта из ATX_AMBULANCE.RECIPE */
  recipe?: string | null;
  /** Код МКБ-10 выбранного диагноза */
  mkbCode?: string | null;
  /** Название МКБ-10 выбранного диагноза */
  mkbName?: string | null;
  /** Опциональные поля — по умолчанию прочерки */
  brigadeNumber?: string;
  cardNumber?: string;
  date?: string;
  patientName?: string;
  patientAge?: string;
  doctorName?: string;
  /** «Получил» — количество прописью. Если null — прочерк. */
  amountWords?: string | null;
  /** Подпись врача */
  doctorSignature?: string;
};

const DASH = "—";

/** Пытаемся вытащить «количество» из начала строки рецепта, если оно есть */
function parseAmountFromRecipe(recipe: string | null | undefined): string {
  if (!recipe) return DASH;
  // Примеры: "Tab. 300 mg №1", "Sol. 1% 1,0 ml — 3 амп."
  const m =
    recipe.match(/№\s*(\d+)/i) || recipe.match(/(\d+)\s*(?:амп|таб|шт)/i);
  return m?.[1] ?? DASH;
}

export default function NarcoticForm({
  recipe,
  mkbCode,
  mkbName,
  brigadeNumber = DASH,
  cardNumber = DASH,
  date = DASH,
  patientName = DASH,
  patientAge = DASH,
  doctorName = DASH,
  amountWords = null,
  doctorSignature = DASH,
}: Props) {
  const substance = recipe?.trim() || DASH;
  const diagnosis =
    mkbCode || mkbName
      ? `${mkbCode ?? ""}${mkbCode && mkbName ? " — " : ""}${mkbName ?? ""}`
      : DASH;

  const amount = useMemo(() => parseAmountFromRecipe(recipe), [recipe]);

  return (
    <div className="narcotic-form">
      <h3 className="narcotic-form__title">
        Бланк по использованию наркотического, психотропного (сп. II, III)
        сильнодействующего вещества на бригаде №&nbsp;
        <Underline>{brigadeNumber}</Underline>
      </h3>

      <div className="narcotic-form__row narcotic-form__row--split">
        <div>
          №&nbsp;<Underline>{cardNumber}</Underline>&nbsp;карты
        </div>
        <div>
          «<Underline>{date}</Underline>» 20___ г.
        </div>
      </div>

      <Field label="Ф.И.О. больного" value={patientName} />

      <div className="narcotic-form__row narcotic-form__row--split">
        <div className="narcotic-form__inline">
          <span className="narcotic-form__label">Возраст</span>
          <Underline>{patientAge}</Underline>
        </div>
        <div className="narcotic-form__inline">
          <span className="narcotic-form__label">Ф.И.О. врача</span>
          <Underline>{doctorName}</Underline>
        </div>
      </div>

      <Field
        label="Наименование наркотического, психотропного, сильнодействующего вещества"
        value={substance}
        multiline
      />

      <Field label="Количество ампул (таблеток)" value={amount} />
      <Field label="Диагноз больного" value={diagnosis} multiline />

      <div className="narcotic-form__row narcotic-form__row--split">
        <div className="narcotic-form__inline">
          <span className="narcotic-form__label">Получил</span>
          <Underline>{amountWords ?? DASH}</Underline>
        </div>
        <div className="narcotic-form__hint">количество прописью</div>
      </div>

      <Field label="Наименование вещества" value={substance} multiline />
      <Field label="Ф.И.О., подпись врача" value={doctorSignature} />
    </div>
  );
}

function Underline({ children }: { children: React.ReactNode }) {
  return <span className="narcotic-form__underline">{children}</span>;
}

function Field({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="narcotic-form__field">
      <div className="narcotic-form__label">{label}</div>
      <div
        className={`narcotic-form__value${
          multiline ? " narcotic-form__value--multiline" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
