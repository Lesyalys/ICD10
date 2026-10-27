// src/screens/call-card/CallCardDiagnosis.tsx
type Props = {
  code: string;
  name: string;
  onChangeDiagnosis: () => void;
};

export default function CallCardDiagnosis({
  code,
  name,
  onChangeDiagnosis,
}: Props) {
  return (
    <div className="call-card__card-head">
      <div className="call-card__card-head-row">
        <span className="call-card__card-code">{code}</span>
        <div>
          <p className="call-card__card-status">Код выбран</p>
          <h2 className="call-card__card-title">{name}</h2>
        </div>
      </div>
      <button
        className="call-card__card-change"
        onClick={onChangeDiagnosis}
        type="button"
      >
        Изменить диагноз
      </button>
    </div>
  );
}
