type Props = {
  title: string;
  discription: string;
  onOpen: () => void;
};

export default function HomeSelectBtn({ title, discription, onOpen }: Props) {
  return (
    <button
      className="service-button group flex h-[76px] w-full items-center gap-4 rounded-xl border border-white/75 bg-white/10 px-5 text-left backdrop-blur-md transition active:scale-[0.985]"
      onClick={onOpen}
      type="button"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-[#10213b] shadow-lg shadow-black/10" />
      <span className="min-w-0 flex-1">
        <span className="font-inter-bold block text-2xl leading-none">
          {title}
        </span>
        <span className="mt-1.5 block text-xs text-white/60">
          {discription}
        </span>
      </span>
    </button>
  );
}
