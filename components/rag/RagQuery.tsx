"use client";

import { useState } from "react";

export default function RagQuery() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runQuery() {
    if(!query.trim()) return;
    setLoading(true);
    
    try {
        const form = new FormData();
        form.append("query", query);

        const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/rag/query`,
        {
            method: "POST",
            body: form,
        }
        );
        
        if(!res.ok) throw new Error("Query failed");
        setResult(await res.json());
    } catch (e) {
        alert("Error querying database");
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl border border-zinc-300 shadow-sm flex flex-col h-full">
      <div className="mb-6 border-b border-zinc-100 pb-4">
        <h2 className="text-xl font-bold text-zinc-900">Test Database</h2>
        <p className="text-zinc-500 mt-1">Run a raw query against your indexed documents.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border border-zinc-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-zinc-800 focus:outline-none text-black"
          placeholder="Enter your question here..."
        />
        <button
          onClick={runQuery}
          disabled={loading}
          className="bg-white text-black border border-zinc-300 px-6 py-3 rounded-lg font-semibold hover:bg-zinc-50 hover:border-zinc-400 transition-all shadow-sm"
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      <div className="flex-1 bg-zinc-50 rounded-lg border border-zinc-200 p-4 overflow-hidden flex flex-col relative">
        <div className="absolute top-2 right-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">JSON Response</div>
        <div className="flex-1 overflow-auto">
            {result ? (
            <pre className="text-sm font-mono text-zinc-800 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
            </pre>
            ) : (
            <div className="h-full flex items-center justify-center text-zinc-400 italic">
                No results yet. Run a query above.
            </div>
            )}
        </div>
      </div>
    </div>
  );
}