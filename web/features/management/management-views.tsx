"use client";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { api, getApiUrl } from "@/lib/api-client";
import { formatRupiah } from "@/lib/currency";
import type { Category, Customer, Product, Sale } from "@/types/api";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@/components/shared/status-view";
import { allProducts, exportCsv, Field, Modal } from "./controls";

type Inventory = {
  id: string;
  quantity: number;
  reserved: number;
  product: {
    id: string;
    name: string;
    sku: string;
    minimumStock: number;
    sellingPrice: string;
  };
};
type Kind = "products" | "customers" | "inventory" | "sales";
const titles = {
  products: "Daftar produk",
  customers: "Pelanggan",
  inventory: "Stok produk",
  sales: "Riwayat transaksi",
};
const actions = {
  products: "Tambah produk",
  customers: "Tambah pelanggan",
  inventory: "Penyesuaian stok",
  sales: "Transaksi baru",
};
export function ProductsView() {
  return <Management kind="products" />;
}
export function CustomersView() {
  return <Management kind="customers" />;
}
export function InventoryView() {
  return <Management kind="inventory" />;
}
export function SalesView({ goToPos }: { goToPos: () => void }) {
  return <Management kind="sales" goToPos={goToPos} />;
}

function Management({ kind, goToPos }: { kind: Kind; goToPos?: () => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const client = useQueryClient();
  const products = useQuery({
    queryKey: ["products-table"],
    queryFn: () => allProducts<Product>(),
    enabled: kind === "products" || kind === "inventory",
  });
  const customers = useQuery({
    queryKey: ["customers-table", search],
    queryFn: () =>
      api<Customer[]>("/customers?search=" + encodeURIComponent(search)).then(
        (r) => r.data,
      ),
    enabled: kind === "customers",
  });
  const inventory = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api<Inventory[]>("/inventory").then((r) => r.data),
    enabled: kind === "inventory",
  });
  const sales = useQuery({
    queryKey: ["sales-table"],
    queryFn: () => api<Sale[]>("/sales").then((r) => r.data),
    enabled: kind === "sales",
  });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Category[]>("/products/categories").then((r) => r.data),
    enabled: kind === "products",
  });
  const query = { products, customers, inventory, sales }[kind];
  const save = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api(
        kind === "inventory"
          ? "/inventory/adjustments"
          : "/" +
              kind +
              (typeof editing === "object" && editing ? "/" + editing.id : ""),
        {
          method: typeof editing === "object" && editing ? "PATCH" : "POST",
          body: JSON.stringify(data),
        },
      ),
    onSuccess: async () => {
      await client.invalidateQueries();
      setEditing(null);
      toast.success("Data berhasil disimpan");
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries(form);
    if (kind === "products") {
      for (const key of [
        "costPrice",
        "sellingPrice",
        "taxRate",
        "discount",
        "minimumStock",
      ])
        data[key] = Number(data[key]);
      data.categoryId = data.categoryId || null;
      data.barcode = data.barcode || null;
      data.active = form.get("active") === "on";
    }
    if (kind === "customers")
      for (const key of ["email", "phone", "address", "notes"])
        data[key] = data[key] || null;
    if (kind === "inventory") data.quantity = Number(data.quantity);
    save.mutate(data);
  }
  const needle = search.toLowerCase();
  const p = (products.data || []).filter(
    (x) =>
      [x.name, x.sku, x.barcode].some((v) =>
        v?.toLowerCase().includes(needle),
      ) &&
      (!filter || (filter === "active" ? x.active : !x.active)),
  );
  const c = (customers.data || []).filter(
    (x) => !filter || (filter === "email" ? !!x.email : !x.email),
  );
  const i = (inventory.data || []).filter(
    (x) =>
      (x.product.name + x.product.sku).toLowerCase().includes(needle) &&
      (!filter ||
        (filter === "low"
          ? x.quantity > 0 && x.quantity <= x.product.minimumStock
          : x.quantity <= 0)),
  );
  const s = (sales.data || []).filter(
    (x) =>
      (x.invoiceNumber + (x.customer?.name || ""))
        .toLowerCase()
        .includes(needle) &&
      (!filter || x.payments?.some((p) => p.method === filter)),
  );
  const headers = {
    products: [
      "Produk",
      "SKU",
      "Barcode",
      "Kategori",
      "Harga jual",
      "Stok",
      "Status",
    ],
    customers: ["Nama", "Email", "Telepon"],
    inventory: ["Produk", "SKU", "Stok tersedia", "Stok minimum"],
    sales: ["Invoice", "Waktu", "Pelanggan", "Total"],
  }[kind];
  const rows =
    kind === "products"
      ? p.map((x) => [
          x.name,
          x.sku,
          x.barcode,
          x.category?.name,
          formatRupiah(x.sellingPrice),
          x.inventories.reduce((n, v) => n + v.quantity, 0),
          x.active ? "Aktif" : "Arsip",
        ])
      : kind === "customers"
        ? c.map((x) => [x.name, x.email, x.phone])
        : kind === "inventory"
          ? i.map((x) => [
              x.product.name,
              x.product.sku,
              x.quantity - x.reserved,
              x.product.minimumStock,
            ])
          : s.map((x) => [
              x.invoiceNumber,
              new Date(x.createdAt).toLocaleString("id-ID"),
              x.customer?.name || "Pelanggan umum",
              formatRupiah(x.total),
            ]);
  const options =
    kind === "products"
      ? [
          ["active", "Aktif"],
          ["inactive", "Arsip"],
        ]
      : kind === "customers"
        ? [
            ["email", "Dengan email"],
            ["no-email", "Tanpa email"],
          ]
        : kind === "inventory"
          ? [
              ["low", "Menipis"],
              ["empty", "Habis"],
            ]
          : [
              ["CASH", "Tunai"],
              ["QRIS_MANUAL", "QRIS"],
              ["DEBIT_CARD", "Kartu debit"],
            ];
  const product = typeof editing === "object" ? editing : null;
  return (
    <div>
      <section className="module-header">
        <h1>{titles[kind]}</h1>
        <button
          className="button primary"
          onClick={() => {
            save.reset();
            if (kind === "sales") goToPos?.();
            else setEditing("new");
          }}
        >
          <Plus size={17} />
          {actions[kind]}
        </button>
      </section>
      <section className="table-toolbar">
        <div className="table-search">
          <Search size={18} />
          <input
            aria-label="Cari data"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter data"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Semua</option>
          {options.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button
          className="button secondary"
          disabled={!rows.length || query.isFetching}
          onClick={() => exportCsv(kind, [headers, ...rows])}
        >
          <Download size={17} />
          Ekspor CSV
        </button>
      </section>
      {query.isLoading ? (
        <LoadingView />
      ) : query.error ? (
        <ErrorView
          message={query.error.message}
          retry={() => void query.refetch()}
        />
      ) : !rows.length ? (
        <EmptyView
          title="Tidak ada data"
          description="Belum ada data yang sesuai."
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
                {(kind === "products" || kind === "sales") && <th>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  {row.map((v, col) => (
                    <td key={col}>{v ?? "-"}</td>
                  ))}
                  {kind === "products" && (
                    <td>
                      <button
                        className="icon-button"
                        title="Edit produk"
                        onClick={() => {
                          save.reset();
                          setEditing(p[index]);
                        }}
                      >
                        <Pencil size={17} />
                      </button>
                    </td>
                  )}
                  {kind === "sales" && (
                    <td>
                      <button
                        className="button secondary"
                        onClick={() => setDetail(s[index].id)}
                      >
                        Detail invoice
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {kind === "sales" && (
        <p>
          Menampilkan hingga 100 transaksi terbaru. Rekap seluruh periode
          tersedia di Laporan.
        </p>
      )}
      {editing && (
        <Modal
          title={product ? "Edit produk" : actions[kind]}
          close={() => {
            if (!save.isPending) setEditing(null);
          }}
        >
          <form className="management-form" onSubmit={submit}>
            <fieldset disabled={save.isPending}>
              {kind === "products" && (
                <>
                  <Field
                    label="Nama produk"
                    name="name"
                    value={product?.name}
                    required
                    minLength={2}
                    maxLength={150}
                  />
                  <Field
                    label="SKU"
                    name="sku"
                    value={product?.sku}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                  <Field
                    label="Barcode"
                    name="barcode"
                    value={product?.barcode}
                    maxLength={50}
                  />
                  <label>
                    Kategori
                    <select
                      name="categoryId"
                      defaultValue={product?.category?.id || ""}
                    >
                      <option value="">Tanpa kategori</option>
                      {categories.data?.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Harga modal"
                    name="costPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    value={product?.costPrice || 0}
                    required
                  />
                  <Field
                    label="Harga jual"
                    name="sellingPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    value={product?.sellingPrice || 0}
                    required
                  />
                  <Field
                    label="Pajak (%)"
                    name="taxRate"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={product?.taxRate || 0}
                    required
                  />
                  <Field
                    label="Diskon (Rp)"
                    name="discount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={product?.discount || 0}
                    required
                  />
                  <Field
                    label="Stok minimum"
                    name="minimumStock"
                    type="number"
                    min={0}
                    value={product?.minimumStock ?? 5}
                    required
                  />
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={product?.active ?? true}
                    />
                    Produk aktif
                  </label>
                </>
              )}
              {kind === "customers" && (
                <>
                  <Field
                    label="Nama pelanggan"
                    name="name"
                    required
                    minLength={2}
                  />
                  <Field label="Email" name="email" type="email" />
                  <Field label="Telepon" name="phone" maxLength={30} />
                  <Field label="Alamat" name="address" maxLength={500} />
                  <Field label="Catatan" name="notes" maxLength={500} />
                </>
              )}
              {kind === "inventory" && (
                <>
                  <label>
                    Produk
                    <select name="productId" required defaultValue="">
                      <option value="" disabled>
                        Pilih produk
                      </option>
                      {products.data?.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name} ({x.sku})
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field
                    label="Perubahan stok (+ / -)"
                    name="quantity"
                    type="number"
                    required
                  />
                  <Field
                    label="Alasan penyesuaian"
                    name="reason"
                    required
                    minLength={3}
                    maxLength={300}
                  />
                </>
              )}
            </fieldset>
            {save.error && (
              <p role="alert" className="form-error">
                {save.error.message}
              </p>
            )}
            <button
              className="button primary"
              disabled={
                save.isPending ||
                (kind === "inventory" && !products.data?.length)
              }
            >
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </form>
        </Modal>
      )}
      {detail && <SaleDetail id={detail} close={() => setDetail(null)} />}
    </div>
  );
}
function SaleDetail({ id, close }: { id: string; close: () => void }) {
  const query = useQuery({
    queryKey: ["sale", id],
    queryFn: () => api<Sale>("/sales/" + id).then((r) => r.data),
  });
  return (
    <Modal title={query.data?.invoiceNumber || "Detail invoice"} close={close}>
      {query.isLoading ? (
        <LoadingView />
      ) : query.error ? (
        <ErrorView
          message={query.error.message}
          retry={() => void query.refetch()}
        />
      ) : (
        <>
          <p>{query.data?.customer?.name || "Pelanggan umum"}</p>
          {query.data?.items?.map((x) => (
            <p key={x.id}>
              {x.productName} x {x.quantity}: {formatRupiah(x.subtotal)}
            </p>
          ))}
          <h3>{formatRupiah(query.data?.total || 0)}</h3>
          <a
            className="button primary"
            href={getApiUrl() + "/sales/" + id + "/invoice.pdf"}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={17} />
            Invoice PDF
          </a>
        </>
      )}
    </Modal>
  );
}
