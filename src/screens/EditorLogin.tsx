import { useState } from "react";
import { supabase } from "../DB/supabase.js";

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
};

export default function EditorLogin({ onSuccess, onCancel }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-[18px] font-extrabold">Вход в редактор</h2>
        <p className="mt-1 text-[12px] text-slate-500">
          Только для авторизованных сотрудников
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-[#356181]"
          required
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-[#356181]"
          required
        />

        {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-lg bg-[#173653] py-2 text-[13px] font-bold text-white disabled:opacity-60"
          >
            {loading ? "Вход…" : "Войти"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-slate-100 px-3 py-2 text-[13px] font-bold text-slate-600"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
