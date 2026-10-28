// src/utils/routes.ts
import { supabase } from "../DB/supabase.js";

let cache: string[] | null = null;

export async function fetchRoutes(): Promise<string[]> {
  if (cache) return cache;

  const { data, error } = await supabase.rpc("get_routes");
  if (error) {
    console.error("fetchRoutes error:", error);
    return [];
  }
  // RPC вернёт массив строк
  const arr = (Array.isArray(data) ? data : []) as string[];
  cache = arr;
  return arr;
}

export function clearRoutesCache() {
  cache = null;
}
