// src/screens/call-card/CallCardMkbTree.tsx
import type { Icd10Item } from "./types.ts";

type Props = {
  searchMode: boolean;
  searching: boolean;
  searchResults: Icd10Item[];
  rootNodes: Icd10Item[];
  rootLoading: boolean;
  parentIdsLoaded: boolean;
  parentIds: Set<number>;
  expanded: Set<number>;
  nodes: Record<string, Icd10Item[]>;
  loadingNodes: Set<number | "root">;
  onToggle: (item: Icd10Item) => void;
  onPickFromSearch: (item: Icd10Item) => void;
  onOpenGroup: (item: Icd10Item) => void; // ← новое
};

const depthClass = (depth: number) =>
  depth === 0
    ? "call-card__node--depth-0"
    : depth === 1
      ? "call-card__node--depth-1"
      : depth === 2
        ? "call-card__node--depth-2"
        : depth === 3
          ? "call-card__node--depth-3"
          : depth === 4
            ? "call-card__node--depth-4"
            : "call-card__node--depth-5";

export default function CallCardMkbTree(props: Props) {
  const {
    searchMode,
    searching,
    searchResults,
    rootNodes,
    rootLoading,
    parentIdsLoaded,
    parentIds,
    expanded,
    nodes,
    loadingNodes,
    onToggle,
    onPickFromSearch,
    onOpenGroup,
  } = props;

  function renderNode(item: Icd10Item, depth: number) {
    const id = item.ID;
    const isExpanded = expanded.has(id);
    const isLoading = loadingNodes.has(id);
    const children = nodes[id];
    const isLeaf = parentIdsLoaded && !parentIds.has(id);

    return (
      <div key={id} className={`call-card__node ${depthClass(depth)}`}>
        <div className="flex items-center">
          <button
            className="call-card__node-btn flex-1"
            onClick={() => onToggle(item)}
            type="button"
          >
            <span className="call-card__node-code">{item.MKB_CODE}</span>
            <span className="call-card__node-name">{item.MKB_NAME}</span>

            {!isLeaf &&
              (isLoading ? (
                <span className="call-card__node-loading">…</span>
              ) : (
                <span
                  className={
                    "call-card__node-arrow" +
                    (isExpanded ? " call-card__node-arrow--expanded" : "")
                  }
                >
                  ▶
                </span>
              ))}
          </button>

          {/* Кнопка «Открыть карту» для групп */}
          {!isLeaf && (
            <button
              type="button"
              title="Открыть карту группы"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGroup(item);
              }}
              className="mr-2 shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-[#356181] transition hover:bg-slate-50"
            >
              Открыть
            </button>
          )}
        </div>

        {isExpanded && children && children.length > 0 && (
          <div className="call-card__node-children">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <section>
      <div className="call-card__list-header">
        <h2 className="call-card__list-title">
          {searchMode ? (searching ? "Поиск…" : "Найдено") : "Классы МКБ-10"}
        </h2>
        <span className="call-card__list-count">
          {searchMode ? searchResults.length : rootNodes.length}
        </span>
      </div>

      <p className="call-card__list-hint">
        {searchMode
          ? "Результаты поиска по коду и наименованию"
          : "Нажмите на класс, чтобы раскрыть, или «Открыть» — чтобы посмотреть карту группы"}
      </p>

      <div className="call-card__list">
        {searchMode ? (
          searchResults.length ? (
            searchResults.map((item) => (
              <button
                className="call-card__search-item"
                key={item.ID}
                onClick={() => onPickFromSearch(item)}
                type="button"
              >
                <span className="call-card__code">{item.MKB_CODE}</span>
                <span className="call-card__search-name">{item.MKB_NAME}</span>
              </button>
            ))
          ) : (
            !searching && (
              <div className="call-card__empty">
                <p className="call-card__empty-title">Ничего не найдено</p>
                <p className="call-card__empty-text">
                  Проверьте код или наименование диагноза
                </p>
              </div>
            )
          )
        ) : rootLoading ? (
          <p className="call-card__list-loading">Загрузка…</p>
        ) : (
          rootNodes.map((item) => renderNode(item, 0))
        )}
      </div>
    </section>
  );
}
