import { beforeEach, describe, expect, it } from "vitest";
import type { PersistedClient } from "@tanstack/query-persist-client-core";
import { indexedDbPersister } from "@/lib/query-persister";

const cachedClient: PersistedClient = {
  timestamp: Date.now(),
  buster: "test-cache",
  clientState: {
    mutations: [],
    queries: [],
  },
};

describe("indexedDbPersister", () => {
  beforeEach(async () => {
    await indexedDbPersister.removeClient();
  });

  it("menyimpan dan mengambil kembali query cache", async () => {
    await indexedDbPersister.persistClient(cachedClient);

    await expect(indexedDbPersister.restoreClient()).resolves.toEqual(
      cachedClient,
    );
  });

  it("menghapus query cache", async () => {
    await indexedDbPersister.persistClient(cachedClient);
    await indexedDbPersister.removeClient();

    await expect(indexedDbPersister.restoreClient()).resolves.toBeUndefined();
  });
});
