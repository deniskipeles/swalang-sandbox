"use client";

import { useState } from "react";
import { searchSimilar } from "@/lib/astra";

export function VectorSearch({ projectId }: { projectId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const search = async () => {
    const res = await searchSimilar(projectId, { text: query, limit: 5 });
    setResults(res);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h3 className="text-white font-bold mb-2">🔍 AI Vector Search</h3>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search code semantically..."
          className="flex-1 p-2 bg-gray-800 text-white rounded"
        />
        <button onClick={search} className="bg-purple-600 hover:bg-purple-700 px-4 rounded">
          Search
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {results.map((r) => (
          <div key={r.path} className="p-2 bg-gray-800 rounded">
            <div className="text-blue-400 font-mono text-sm">{r.path}</div>
            <div className="text-gray-400 text-xs">Similarity: {(r.similarity * 100).toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}