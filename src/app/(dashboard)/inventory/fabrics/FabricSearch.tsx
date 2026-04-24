"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function FabricSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/inventory/fabrics?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/inventory/fabrics");
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по тканям..."
        className="pl-9 pr-3 py-1.5 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none w-56"
      />
    </form>
  );
}
