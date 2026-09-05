"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Barcode,
  ChevronLeft,
  ChevronRight,
  CircleMinus,
  CirclePlus,
  CreditCard,
  LoaderCircle,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError, getApiUrl } from "@/lib/api-client";
import { formatRupiah } from "@/lib/currency";
import { useCartStore } from "@/stores/cart.store";
import { queueOfflineSale } from "@/lib/offline-db";
import type { Category, Customer, Product, Sale } from "@/types/api";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@/components/shared/status-view";

type ProductResponse = Product[];
type Shift = { id: string; openingCash: string; openedAt: string };
const paymentOptions = [
  { id: "CASH", label: "Tunai", icon: Banknote },
  { id: "QRIS_MANUAL", label: "QRIS", icon: WalletCards },
  { id: "DEBIT_CARD", label: "Kartu debit", icon: CreditCard },
];

export function PosView() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [paying, setPaying] = useState(false);
  const [opening, setOpening] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef("");
  const barcodeTime = useRef(0);
  const queryClient = useQueryClient();
  const cart = useCartStore();
  const products = useQuery({
    queryKey: ["products", search, category, page],
    queryFn: () =>
      api<ProductResponse>(
        `/products?limit=60&page=${page}&search=${encodeURIComponent(search)}${category ? `&categoryId=${category}` : ""}`,
      ),
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/products/categories").then((r) => r.data),
  });
  const customers = useQuery({
    queryKey: ["customers"],
    queryFn: () => api<Customer[]>("/customers").then((r) => r.data),
  });
  const shift = useQuery({
    queryKey: ["current-shift"],
    queryFn: () => api<Shift | null>("/shifts/current").then((r) => r.data),
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "INPUT") return;
      const now = Date.now();
      if (now - barcodeTime.current > 120) barcodeBuffer.current = "";
      barcodeTime.current = now;
      if (event.key === "Enter" && barcodeBuffer.current.length >= 4) {
        const code = barcodeBuffer.current;
        barcodeBuffer.current = "";
        const product = products.data?.data.find(
          (item) => item.barcode === code || item.sku === code,
        );
        if (product) {
          cart.add(product);
          toast.success(`${product.name} ditambahkan`);
        } else toast.error(`Barcode ${code} tidak ditemukan`);
      } else if (event.key.length === 1) barcodeBuffer.current += event.key;
      if (event.key === "F2") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [products.data, cart]);
  const summary = useMemo(() => {
    const base = cart.items.reduce(
      (sum, item) =>
        sum + Math.max(0, item.price * item.quantity - item.discount),
      0,
    );
    const tax = cart.items.reduce(
      (sum, item) =>
        sum +
        (Math.max(0, item.price * item.quantity - item.discount) *
          item.taxRate) /
          100,
      0,
    );
    return {
      subtotal: base,
      tax,
      total: Math.max(0, base + tax - cart.transactionDiscount),
      count: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [cart.items, cart.transactionDiscount]);

  return (
    <div className="pos-layout">
      <section className="catalog">
        <div className="pos-toolbar">
          <div>
            <h1>Kasir</h1>
            <p>Pilih produk atau pindai barcode</p>
          </div>
          <div className={`shift-status ${shift.data ? "active" : ""}`}>
            <i />
            {shift.data ? "Shift aktif" : "Shift belum dibuka"}
            {!shift.data && (
              <button onClick={() => setOpening(true)}>Buka shift</button>
            )}
          </div>
        </div>
        <div className="product-search">
          <Search size={20} />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama, SKU, atau barcode..."
          />
          <span>
            <Barcode size={18} /> F2 untuk scan
          </span>
        </div>
        <div className="category-tabs">
          <button
            className={!category ? "active" : ""}
            onClick={() => {
              setCategory("");
              setPage(1);
            }}
          >
            Semua produk
          </button>
          {categories.data?.map((item) => (
            <button
              key={item.id}
              className={category === item.id ? "active" : ""}
              onClick={() => {
                setCategory(item.id);
                setPage(1);
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
        <div className="product-area">
          {products.isLoading ? (
            <LoadingView label="Memuat katalog..." />
          ) : products.error ? (
            <ErrorView
              message={
                products.error instanceof ApiError
                  ? products.error.message
                  : "Gagal memuat produk"
              }
              retry={() => void products.refetch()}
            />
          ) : products.data?.data.length ? (
            <div className="product-grid">
              {products.data.data.map((product) => {
                const stock = product.inventories[0]?.quantity ?? 0;
                return (
                  <button
                    className="product-card"
                    key={product.id}
                    disabled={!product.active || stock <= 0}
                    onClick={() => cart.add(product)}
                  >
                    <div className="product-image">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].secureUrl}
                          alt={product.images[0].altText || product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 180px"
                        />
                      ) : (
                        <span>{product.name.slice(0, 2).toUpperCase()}</span>
                      )}
                      <i className={stock <= product.minimumStock ? "low" : ""}>
                        {stock <= 0 ? "Habis" : `Stok ${stock}`}
                      </i>
                    </div>
                    <div className="product-info">
                      <small>
                        {product.category?.name || "Tanpa kategori"}
                      </small>
                      <strong>{product.name}</strong>
                      <span>{formatRupiah(product.sellingPrice)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyView
              title="Produk tidak ditemukan"
              description="Coba kata kunci atau kategori yang lain."
            />
          )}
        </div>
        <div className="catalog-footer">
          <span>
            Menampilkan {products.data?.data.length || 0} dari{" "}
            {Number(products.data?.meta.total || 0)} produk
          </span>
          <div>
            <button
              aria-label="Halaman sebelumnya"
              disabled={page <= 1 || products.isFetching}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <b>{page}</b>
            <button
              aria-label="Halaman berikutnya"
              disabled={
                page >= Number(products.data?.meta.pages || 1) ||
                products.isFetching
              }
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
      <aside className="cart-panel">
        <div className="cart-head">
          <span>
            <ShoppingCart size={20} />
          </span>
          <div>
            <h3>Keranjang</h3>
            <p>{summary.count} item dipilih</p>
          </div>
          {cart.items.length > 0 && (
            <button onClick={cart.clear}>Kosongkan</button>
          )}
        </div>
        <div className="customer-select">
          <UserRound size={18} />
          <select
            value={cart.customerId || ""}
            onChange={(e) => cart.setCustomer(e.target.value || null)}
          >
            <option value="">Pelanggan umum</option>
            {customers.data?.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <ChevronRight size={17} />
        </div>
        <div className="cart-items">
          {cart.items.length ? (
            cart.items.map((item) => (
              <div className="cart-item" key={item.productId}>
                <div className="cart-thumb">
                  {item.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="cart-item-main">
                  <div>
                    <strong>{item.name}</strong>
                    <button onClick={() => cart.remove(item.productId)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <small>
                    {item.sku} · {formatRupiah(item.price)}
                  </small>
                  <div className="quantity">
                    <button
                      onClick={() =>
                        item.quantity === 1
                          ? cart.remove(item.productId)
                          : cart.setQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      <CircleMinus size={19} />
                    </button>
                    <b>{item.quantity}</b>
                    <button
                      onClick={() =>
                        cart.setQuantity(item.productId, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.stock}
                    >
                      <CirclePlus size={19} />
                    </button>
                    <span>{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-cart">
              <span>
                <ShoppingCart size={31} />
              </span>
              <strong>Keranjang masih kosong</strong>
              <p>Pilih produk di sebelah kiri untuk memulai transaksi.</p>
            </div>
          )}
        </div>
        <div className="cart-summary">
          <div>
            <span>Subtotal</span>
            <b>{formatRupiah(summary.subtotal)}</b>
          </div>
          <div>
            <span>Pajak</span>
            <b>{formatRupiah(summary.tax)}</b>
          </div>
          <div>
            <span>Diskon transaksi</span>
            <input
              type="number"
              min="0"
              value={cart.transactionDiscount}
              onChange={(e) => cart.setDiscount(Number(e.target.value))}
            />
          </div>
          <div className="grand-total">
            <span>Total</span>
            <strong>{formatRupiah(summary.total)}</strong>
          </div>
          <button
            className="button pay-button"
            disabled={!cart.items.length}
            onClick={() => (shift.data ? setPaying(true) : setOpening(true))}
          >
            <span>Bayar sekarang</span>
            <strong>{formatRupiah(summary.total)}</strong>
          </button>
          <p className="shortcut-hint">
            Tekan <kbd>F9</kbd> untuk pembayaran cepat
          </p>
        </div>
      </aside>
      {opening && (
        <ShiftModal
          close={() => setOpening(false)}
          done={() => {
            setOpening(false);
            void shift.refetch();
          }}
        />
      )}{" "}
      {paying && (
        <PaymentModal
          total={summary.total}
          close={() => setPaying(false)}
          done={(sale) => {
            setPaying(false);
            setReceipt(sale);
            cart.clear();
            void queryClient.invalidateQueries();
          }}
        />
      )}{" "}
      {receipt && (
        <ReceiptModal sale={receipt} close={() => setReceipt(null)} />
      )}
    </div>
  );
}

function ShiftModal({ close, done }: { close: () => void; done: () => void }) {
  const [cash, setCash] = useState(500000);
  const mutation = useMutation({
    mutationFn: () =>
      api<Shift>("/shifts/open", {
        method: "POST",
        body: JSON.stringify({ openingCash: cash }),
      }),
    onSuccess: done,
  });
  return (
    <div className="modal-layer">
      <div className="modal-card small">
        <button className="modal-close" onClick={close}>
          <X />
        </button>
        <span className="modal-icon">
          <Banknote />
        </span>
        <h2>Buka shift kasir</h2>
        <p>Catat jumlah uang tunai di laci sebelum mulai menerima transaksi.</p>
        <label>Modal awal</label>
        <div className="money-input">
          <span>Rp</span>
          <input
            type="number"
            min="0"
            value={cash}
            onChange={(e) => setCash(Number(e.target.value))}
          />
        </div>
        {mutation.error && (
          <div className="form-error">
            {mutation.error instanceof ApiError
              ? mutation.error.message
              : "Gagal membuka shift"}
          </div>
        )}
        <button
          className="button primary full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <LoaderCircle className="spin" />
          ) : (
            "Buka shift & mulai"
          )}
        </button>
      </div>
    </div>
  );
}

function PaymentModal({
  total,
  close,
  done,
}: {
  total: number;
  close: () => void;
  done: (sale: Sale) => void;
}) {
  const cart = useCartStore();
  const [method, setMethod] = useState("CASH");
  const [paid, setPaid] = useState(Math.ceil(total / 1000) * 1000);
  const [transactionId] = useState(() => crypto.randomUUID());
  const payload = {
    clientTransactionId: transactionId,
    customerId: cart.customerId,
    discount: cart.transactionDiscount,
    items: cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      discount: item.discount,
    })),
    payments: [{ method, amount: method === "CASH" ? paid : total }],
  };
  const mutation = useMutation({
    mutationFn: () =>
      api<Sale>("/sales", {
        method: "POST",
        headers: { "idempotency-key": transactionId },
        body: JSON.stringify(payload),
      }),
    onSuccess: (r) => done(r.data),
    onError: async (error) => {
      if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
        await queueOfflineSale(transactionId, payload);
        toast.warning(
          "Transaksi disimpan di antrean offline. Sinkronkan saat koneksi pulih.",
        );
      }
    },
  });
  const tendered = method === "CASH" ? paid : total;
  return (
    <div className="modal-layer">
      <div className="modal-card payment-modal">
        <button className="modal-close" onClick={close}>
          <X />
        </button>
        <span className="overline">PEMBAYARAN</span>
        <h2>Selesaikan transaksi</h2>
        <div className="payment-total">
          <span>Total tagihan</span>
          <strong>{formatRupiah(total)}</strong>
        </div>
        <label>Metode pembayaran</label>
        <div className="payment-options">
          {paymentOptions.map(({ id, label, icon: Icon }) => (
            <button
              className={method === id ? "active" : ""}
              key={id}
              onClick={() => {
                setMethod(id);
                if (id !== "CASH") setPaid(total);
              }}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        {method === "CASH" && (
          <>
            <label>Uang diterima</label>
            <div className="money-input large">
              <span>Rp</span>
              <input
                autoFocus
                type="number"
                min={total}
                value={paid}
                onChange={(e) => setPaid(Number(e.target.value))}
              />
            </div>
            <div className="quick-cash">
              {[
                total,
                Math.ceil(total / 10000) * 10000,
                Math.ceil(total / 50000) * 50000,
              ]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((value) => (
                  <button key={value} onClick={() => setPaid(value)}>
                    {formatRupiah(value)}
                  </button>
                ))}
            </div>
            <div className="change-row">
              <span>Kembalian</span>
              <strong>{formatRupiah(Math.max(0, paid - total))}</strong>
            </div>
          </>
        )}
        {mutation.error && (
          <div className="form-error">
            {mutation.error instanceof ApiError
              ? mutation.error.message
              : "Transaksi gagal"}
          </div>
        )}
        <button
          className="button primary full"
          disabled={mutation.isPending || tendered < total}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <>
              <LoaderCircle className="spin" />
              Memproses...
            </>
          ) : (
            <>
              Konfirmasi pembayaran <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ReceiptModal({ sale, close }: { sale: Sale; close: () => void }) {
  return (
    <div className="modal-layer">
      <div className="modal-card small success-modal">
        <button className="modal-close" onClick={close}>
          <X />
        </button>
        <span className="success-check">✓</span>
        <h2>Transaksi berhasil</h2>
        <p>{sale.invoiceNumber}</p>
        <div className="success-total">{formatRupiah(sale.total)}</div>
        <div className="success-actions">
          <button
            className="button secondary"
            onClick={() =>
              window.open(
                `${getApiUrl()}/sales/${sale.id}/invoice.pdf`,
                "_blank",
              )
            }
          >
            Lihat invoice
          </button>
          <button className="button primary" onClick={close}>
            Transaksi baru
          </button>
        </div>
      </div>
    </div>
  );
}
