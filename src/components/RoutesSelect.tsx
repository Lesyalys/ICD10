// src/components/RoutesSelect.tsx
import { useEffect, useState } from "react";
import { fetchRoutes } from "../utils/routes.ts";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export default function RoutesSelect({
  value,
  onChange,
  placeholder,
  disabled,
}: Props) {
  const [routes, setRoutes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchRoutes();

        // Нормализуем: если fetchRoutes вернул RouteRow[] — превратим в string[]
        const names: string[] = data.map((r: any) =>
          typeof r === "string" ? r : (r?.name ?? ""),
        );

        if (!alive) return;
        setRoutes(names.filter(Boolean));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const inList = routes.includes(value);
  const isDisabled = disabled || loading;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={isDisabled}
      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[13px] disabled:opacity-60"
    >
      <option value="">
        {loading ? "Загрузка путей…" : (placeholder ?? "— Путь введения —")}
      </option>
      {routes.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
      {/* Старое значение, которого нет в списке — не теряем */}
      {value && !inList && <option value={value}>{value} (старое)</option>}
    </select>
  );
}
