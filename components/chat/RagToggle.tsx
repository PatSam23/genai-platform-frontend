"use client";

export default function RagToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm font-medium cursor-pointer group px-3 py-2 rounded-md hover:bg-muted/50 transition-colors">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          className="peer sr-only" /* Hide default checkbox */
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        {/* Custom Checkbox visuals */}
        <div className="w-9 h-5 bg-muted border border-muted-foreground/30 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:border-primary"></div>
      </div>
      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
        Enhanced Context (RAG)
      </span>
    </label>
  );
}