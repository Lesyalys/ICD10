// src/screens/MkbDirectory.tsx — дерево ICD10 (родители/дети) без карты
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchIcd10Children,
  searchIcd10Direct,
  fetchParentIdsWithChildren,
} from "../DB/queries.ts";

type Icd10Node = {
  ID: number;
  MKB_CODE: string;
  MKB_NAME: string;
  ID_PARENT: string | null;
  REC_CODE: string;
};

export default function MkbDirectoryScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [nodes, setNodes] = useState<Record<string, Icd10Node[]>>({});
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loadingNodes, setLoadingNodes] = useState<Set<number | "root">>(
    new Set(),
  );
  const [parentIds, setParentIds] = useState<Set<number>>(new Set());
  const [parentIdsLoaded, setParentIdsLoaded] = useState(false);
  const [searchResults, setSearchResults] = useState<Icd10Node[]>([]);
  const [searching, setSearching] = useState(false);
  const reqIdRef = useRef(0);
  const searchMode = query.trim().length >= 2;

  // --- Загрузка корней ICD10 ---
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingNodes((s) => new Set(s).add("root"));
      const [roots, parents] = await Promise.all([
        fetchIcd10Children(null),
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
    const myId = ++reqIdRef.current;
    const t = setTimeout(async () => {
      setSearching(true);
      const data = await searchIcd10Direct(q);
      if (myId !== reqIdRef.current) return;
      setSearchResults(data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  async function toggleNode(item: Icd10Node) {
    const id = item.ID;
    if (parentIdsLoaded && !parentIds.has(id)) return;
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
      const children = await fetchIcd10Children(id);
      setLoadingNodes((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      setNodes((n) => ({ ...n, [id]: children }));
    }
    setExpanded((prev) => new Set(prev).add(id));
  }

  function renderNode(item: Icd10Node, depth: number) {
    const id = item.ID;
    const isExpanded = expanded.has(id);
    const isLoading = loadingNodes.has(id);
    const children = nodes[id];
    const isLeaf = parentIdsLoaded && !parentIds.has(id);

    return (
      <div
        key={id}
        className="call-card__node"
        style={{ paddingLeft: depth * 12 }}
      >
        <div className="flex items-center">
          <button
            className="call-card__node-btn flex-1"
            onClick={() => toggleNode(item)}
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
    <main className="call-card">
      <header className="call-header call-card__header">
        <div className="call-card__header-inner">
          <div className="call-card__topbar">
            <button
              aria-label="Назад"
              className="call-card__back"
              onClick={() => navigate("/")}
              type="button"
            >
              ←
            </button>
            <div className="call-card__brand">
              <p className="call-card__brand-top">Medic</p>
              <p className="call-card__brand-bottom">Справочник</p>
            </div>
            <span className="call-card__doc-icon">📖</span>
          </div>
          <h1 className="call-card__title">Справочник кодов МКБ-10</h1>
          <p className="call-card__subtitle">
            Полный перечень кодов из справочника МКБ-10
          </p>

          <label className="call-card__search">
            <input
              className="call-card__search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по коду или названию…"
            />
          </label>
        </div>
      </header>

      <div className="call-card__body">
        {!searchMode && (
          <section>
            <div className="call-card__list-header">
              <h2 className="call-card__list-title">Классы МКБ-10</h2>
              <span className="call-card__list-count">
                {(nodes.root ?? []).length}
              </span>
            </div>
            <p className="call-card__list-hint">
              Нажмите на класс, чтобы раскрыть подклассы
            </p>
            <div className="call-card__list">
              {loadingNodes.has("root") ? (
                <p className="call-card__list-loading">Загрузка…</p>
              ) : (
                (nodes.root ?? []).map((item) => renderNode(item, 0))
              )}
            </div>
          </section>
        )}

        {searchMode && (
          <section>
            <div className="call-card__list-header">
              <h2 className="call-card__list-title">
                {searching ? "Поиск…" : "Найдено"}
              </h2>
              <span className="call-card__list-count">
                {searchResults.length}
              </span>
            </div>
            <p className="call-card__list-hint">
              Результаты поиска по коду и наименованию
            </p>
            <div className="call-card__list">
              {searchResults.length
                ? searchResults.map((item) => (
                    <div className="call-card__search-item" key={item.ID}>
                      <span className="call-card__code">{item.MKB_CODE}</span>
                      <span className="call-card__search-name">
                        {item.MKB_NAME}
                      </span>
                    </div>
                  ))
                : !searching && (
                    <div className="call-card__empty">
                      <p className="call-card__empty-title">
                        Ничего не найдено
                      </p>
                      <p className="call-card__empty-text">
                        Проверьте код или наименование диагноза
                      </p>
                    </div>
                  )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
