import HomeSelectBtn from "../components/HomeSelectBtn";

export default function MenuScreen({
  onOpen,
  onOpenConsultant,
}: {
  onOpen: () => void;
  onOpenConsultant: () => void;
}) {
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

          <div className="mt-12 w-full space-y-3">
            <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-white/55 uppercase">
              Выберите раздел
            </p>
            <HomeSelectBtn
              title="СМП"
              discription="Примеры карт скорой медицинской помощи"
              onOpen={onOpen}
            />

            <HomeSelectBtn
              title="Консультант"
              discription="Подбор карты по симптомам"
              onOpen={onOpenConsultant}
            />
          </div>
        </div>
        <p className="relative mt-8 text-center text-[11px] tracking-[0.08em] text-white/35">
          ПРОТОКОЛЫ И АЛГОРИТМЫ • 2026
        </p>
      </section>
    </main>
  );
}
