import Dexie, { type EntityTable } from "dexie";

export type PendingSale = {
  id: string;
  payload: string;
  status: "PENDING" | "CONFLICT";
  createdAt: string;
  lastError?: string;
};

export type QueryCacheRecord = {
  id: string;
  value: string;
  updatedAt: number;
};

class NexxusOfflineDatabase extends Dexie {
  sales!: EntityTable<PendingSale, "id">;

  queryCache!: EntityTable<QueryCacheRecord, "id">;

  constructor() {
    super("nexxus-pos-offline");

    this.version(1).stores({ sales: "id,status,createdAt" });

    this.version(2).stores({
      sales: "id,status,createdAt",
      queryCache: "id,updatedAt",
    });
  }
}

export const offlineDb =
  typeof window === "undefined" ? null : new NexxusOfflineDatabase();

export async function queueOfflineSale(id: string, payload: unknown) {
  await offlineDb?.sales.put({
    id,
    payload: JSON.stringify(payload),
    status: "PENDING",
    createdAt: new Date().toISOString(),
  });
}
