export function PreferredNichesSelector({
  niches,
  selected = []
}: {
  niches: { id: string; name: string }[];
  selected?: string[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {niches.slice(0, 12).map((niche) => (
        <label
          key={niche.id}
          className="flex items-center gap-2 rounded-md border border-slate-800 p-2 text-sm text-slate-300"
        >
          <input
            type="checkbox"
            name="preferredNicheIds"
            value={niche.id}
            defaultChecked={selected.includes(niche.id)}
          />
          {niche.name}
        </label>
      ))}
    </div>
  );
}
