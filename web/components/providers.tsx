"use client";

import { useState, type ReactNode } from "react";
import type { Query } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Toaster } from "sonner";
import { makeQueryClient } from "@/lib/query-client";
import { indexedDbPersister } from "@/lib/query-persister";

const CACHEABLE_QUERY_KEYS = new Set([
  "dashboard",
  "products-table",
  "inventory",
  "customers-table",
  "sales-table",
  "products",
  "categories",
  "customers",
]);

function shouldPersistQuery(query: Query) {
  const rootKey = String(query.queryKey[0] ?? "");

  return query.state.status === "success" && CACHEABLE_QUERY_KEYS.has(rootKey);
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: indexedDbPersister,
        maxAge: 30 * 60 * 1_000,
        buster: "nexxus-pos-query-cache-v1",
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      {children}
      <Toaster richColors position="top-right" />
    </PersistQueryClientProvider>
  );
}
