const SERIF = { fontFamily: 'Georgia, "Times New Roman", Times, serif' };

export function Logo({ tagline = "Quality Report" }: { tagline?: string }) {
  return (
    <div className="leading-tight">
      <div style={SERIF} className="text-xl font-semibold uppercase tracking-[0.2em] text-slate-900">
        Belden
      </div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500">{tagline}</div>
    </div>
  );
}
