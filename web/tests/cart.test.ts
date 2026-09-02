import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/stores/cart.store";
import type { Product } from "@/types/api";
const product: Product = {
  id: "p1",
  name: "Kopi Susu",
  sku: "KOP-1",
  barcode: "8991",
  sellingPrice: "18000",
  costPrice: "8000",
  taxRate: "11",
  discount: "0",
  minimumStock: 5,
  active: true,
  category: null,
  images: [],
  inventories: [{ quantity: 10 }],
};
describe("keranjang POS", () => {
  beforeEach(() => useCartStore.getState().clear());
  it("menambah dan mengubah kuantitas tanpa melampaui stok", () => {
    useCartStore.getState().add(product);
    useCartStore.getState().setQuantity("p1", 99);
    expect(useCartStore.getState().items[0]?.quantity).toBe(10);
  });
  it("menghapus item dan mereset transaksi", () => {
    useCartStore.getState().add(product);
    useCartStore.getState().setCustomer("c1");
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().customerId).toBeNull();
  });
});
