export default function MenuScreen({ onOpen }: { onOpen: () => void }) {
  return (
    <main className="menu-screen min-h-dvh text-white">
      <div className="menu-overlay" />
      <section className="relative z-10 flex min-h-dvh flex-col px-7 pb-9 pt-[clamp(5.5rem,15vh,8.5rem)] sm:px-10">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center">
          <h1 className="font-inter-semibold text-5xl leading-none tracking-[-0.04em]">
            Medic
          </h1>
          <p className="mt-4 text-sm font-medium tracking-[0.16em] text-white/60 uppercase">
            Личный помощник
          </p>

          <div className="mt-12 w-full">
            <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-white/55 uppercase">
              Выберите раздел
            </p>
            <button
              className="service-button group flex h-[76px] w-full items-center gap-4 rounded-xl border border-white/75 bg-white/10 px-5 text-left backdrop-blur-md transition active:scale-[0.985]"
              onClick={onOpen}
              type="button"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-[#10213b] shadow-lg shadow-black/10"></span>
              <span className="min-w-0 flex-1">
                <span className="font-inter-bold block text-2xl leading-none">
                  СМП
                </span>
                <span className="mt-1.5 block text-xs text-white/60">
                  Примеры карт скорой медецинской помощи
                </span>
              </span>
            </button>
          </div>
        </div>
        <p className="relative mt-8 text-center text-[11px] tracking-[0.08em] text-white/35">
          ПРОТОКОЛЫ И АЛГОРИТМЫ • 2025
        </p>
      </section>
    </main>
  );
}
