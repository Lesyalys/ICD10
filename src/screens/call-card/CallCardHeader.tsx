// src/screens/call-card/CallCardHeader.tsx
type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  onClear: () => void;
  onBack: () => void;
};

export default function CallCardHeader({
  query,
  onQueryChange,
  onClear,
  onBack,
}: Props) {
  return (
    <header className="call-header call-card__header">
      <div className="call-card__header-inner">
        <div className="call-card__topbar">
          <button
            aria-label="Вернуться в меню"
            className="call-card__back"
            onClick={onBack}
            type="button"
          >
            ←
          </button>
          <div className="call-card__brand">
            <p className="call-card__brand-top">Medic</p>
            <p className="call-card__brand-bottom">Карты СМП</p>
          </div>
          <span className="call-card__doc-icon">📄</span>
        </div>

        <h1 className="call-card__title">Найти карту</h1>
        <p className="call-card__subtitle">
          Поиск по коду или наименованию МКБ-10
        </p>

        <label className="call-card__search">
          <input
            aria-label="Поиск по МКБ-10"
            className="call-card__search-input"
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Например, I21 или инфаркт"
            type="search"
            value={query}
          />
          {query && (
            <button
              aria-label="Очистить поиск"
              className="call-card__search-clear"
              onClick={onClear}
              type="button"
            >
              ×
            </button>
          )}
        </label>
      </div>
    </header>
  );
}
