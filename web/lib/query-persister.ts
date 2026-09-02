import type {
  PersistedClient,
  Persister,
} from "@tanstack/query-persist-client-core";
import { offlineDb } from "@/lib/offline-db";

const QUERY_CACHE_ID = "react-query";

export const indexedDbPersister: Persister = {
  async persistClient(client) {
    if (!offlineDb) {
      return;
    }

    await offlineDb.queryCache.put({
      id: QUERY_CACHE_ID,
      value: JSON.stringify(client),
      updatedAt: Date.now(),
    });
  },

  async restoreClient() {
    if (!offlineDb) {
      return undefined;
    }

    const record = await offlineDb.queryCache.get(QUERY_CACHE_ID);

    if (!record) {
      return undefined;
    }

    try {
      return JSON.parse(record.value) as PersistedClient;
    } catch {
      await offlineDb.queryCache.delete(QUERY_CACHE_ID);

      return undefined;
    }
  },

  async removeClient() {
    await offlineDb?.queryCache.delete(QUERY_CACHE_ID);
  },
};
