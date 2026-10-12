export default function MedicalField({
  label,
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">
        {label}
        <span className="ml-2 p-1 border-2 border-blue-300 rounded-2xl bg-blue-10 hover:bg-blue-200 cursor-pointer transition-colors">
          copy
        </span>
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[#263a4e]">
        {children}
      </p>
    </div>
  );
}
