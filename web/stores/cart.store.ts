import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/api";

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  discount: number;
  taxRate: number;
  notes?: string;
};
type CartState = {
  items: CartItem[];
  customerId: string | null;
  transactionDiscount: number;
  add: (product: Product) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setCustomer: (id: string | null) => void;
  setDiscount: (value: number) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      customerId: null,
      transactionDiscount: 0,
      add: (product) =>
        set((state) => {
          const current = state.items.find(
            (item) => item.productId === product.id,
          );
          const stock = product.inventories[0]?.quantity ?? 0;
          if (current)
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: Math.min(item.quantity + 1, stock) }
                  : item,
              ),
            };
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                sku: product.sku,
                price: Number(product.sellingPrice),
                quantity: 1,
                stock,
                discount: Number(product.discount),
                taxRate: Number(product.taxRate),
              },
            ],
          };
        }),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === id
              ? {
                  ...item,
                  quantity: Math.max(1, Math.min(quantity, item.stock)),
                }
              : item,
          ),
        })),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== id),
        })),
      clear: () => set({ items: [], customerId: null, transactionDiscount: 0 }),
      setCustomer: (customerId) => set({ customerId }),
      setDiscount: (transactionDiscount) =>
        set({ transactionDiscount: Math.max(0, transactionDiscount) }),
    }),
    { name: "nexxus-pos-cart" },
  ),
);
