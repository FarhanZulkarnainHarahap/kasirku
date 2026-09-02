"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  Download,
  Filter,
  Package,
  Plus,
  ReceiptText,
  Search,
  Users,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { formatRupiah } from "@/lib/currency";
import type { Customer, Product, Sale } from "@/types/api";
import {
  EmptyView,
  ErrorView,
  LoadingView,
} from "@/components/shared/status-view";
type InventoryItem = {
  id: string;
  quantity: number;
  reserved: number;
  product: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    minimumStock: number;
    sellingPrice: string;
  };
};
function Header({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Package;
  action: string;
}) {
  return (
    <>
      <section className="module-header">
        <div>
          <span className="eyebrow dark">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="button primary">
          <Plus size={17} />
          {action}
        </button>
      </section>
      <section className="table-toolbar">
        <div className="table-search">
          <Search size={18} />
          <input placeholder={`Cari ${title.toLowerCase()}...`} />
        </div>
        <button className="button secondary">
          <Filter size={17} />
          Filter
        </button>
        <button className="button secondary">
          <Download size={17} />
          Ekspor
        </button>
        <span className="module-icon">
          <Icon size={19} />
        </span>
      </section>
    </>
  );
}
export function ProductsView() {
  const query = useQuery({
    queryKey: ["products-table"],
    queryFn: () => api<Product[]>("/products?limit=100").then((r) => r.data),
  });
  return (
    <div>
      <Header
        eyebrow="KATALOG"
        title="Daftar produk"
        description="Kelola harga, identitas, dan status produk."
        icon={Package}
        action="Tambah produk"
      />
      <DataState query={query}>
        {(items: Product[]) => (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>SKU / Barcode</th>
                  <th>Kategori</th>
                  <th>Harga jual</th>
                  <th>Stok</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>
                      <span>{item.sku}</span>
                      <small>{item.barcode || "—"}</small>
                    </td>
                    <td>{item.category?.name || "—"}</td>
                    <td>
                      <strong>{formatRupiah(item.sellingPrice)}</strong>
                    </td>
                    <td>{item.inventories[0]?.quantity ?? 0}</td>
                    <td>
                      <span
                        className={`status-badge ${item.active ? "green" : "gray"}`}
                      >
                        {item.active ? "Aktif" : "Arsip"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </div>
  );
}
export function InventoryView() {
  const query = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api<InventoryItem[]>("/inventory").then((r) => r.data),
  });
  return (
    <div>
      <Header
        eyebrow="INVENTORI"
        title="Stok produk"
        description="Pantau persediaan dan batas minimum per cabang."
        icon={Boxes}
        action="Penyesuaian stok"
      />
      <DataState query={query}>
        {(items: InventoryItem[]) => (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>SKU</th>
                  <th>Stok tersedia</th>
                  <th>Stok minimum</th>
                  <th>Nilai jual</th>
                  <th>Kondisi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const low = item.quantity <= item.product.minimumStock;
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.product.name}</strong>
                      </td>
                      <td>{item.product.sku}</td>
                      <td>
                        <strong>{item.quantity - item.reserved}</strong>
                      </td>
                      <td>{item.product.minimumStock}</td>
                      <td>
                        {formatRupiah(
                          Number(item.product.sellingPrice) * item.quantity,
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${low ? "amber" : "green"}`}
                        >
                          {item.quantity <= 0
                            ? "Habis"
                            : low
                              ? "Menipis"
                              : "Aman"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </div>
  );
}
export function CustomersView() {
  const query = useQuery({
    queryKey: ["customers-table"],
    queryFn: () => api<Customer[]>("/customers").then((r) => r.data),
  });
  return (
    <div>
      <Header
        eyebrow="CRM"
        title="Pelanggan"
        description="Kenali dan layani pelanggan setia Anda."
        icon={Users}
        action="Tambah pelanggan"
      />
      <DataState query={query}>
        {(items: Customer[]) => (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nama pelanggan</th>
                  <th>Email</th>
                  <th>Telepon</th>
                  <th>Status kontak</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.email || "—"}</td>
                    <td>{item.phone || "—"}</td>
                    <td>
                      <span
                        className={`status-badge ${item.email ? "green" : "gray"}`}
                      >
                        {item.email ? "Siap invoice" : "Email kosong"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </div>
  );
}
export function SalesView() {
  const query = useQuery({
    queryKey: ["sales-table"],
    queryFn: () => api<Sale[]>("/sales").then((r) => r.data),
  });
  return (
    <div>
      <Header
        eyebrow="PENJUALAN"
        title="Riwayat transaksi"
        description="Telusuri pembayaran, pelanggan, dan invoice."
        icon={ReceiptText}
        action="Transaksi baru"
      />
      <DataState query={query}>
        {(items: Sale[]) => (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Waktu</th>
                  <th>Pelanggan</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.invoiceNumber}</strong>
                    </td>
                    <td>
                      {new Date(item.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td>{item.customer?.name || "Pelanggan umum"}</td>
                    <td>
                      <strong>{formatRupiah(item.total)}</strong>
                    </td>
                    <td>
                      <span className="status-badge green">Selesai</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataState>
    </div>
  );
}
function DataState<T>({
  query,
  children,
}: {
  query: {
    isLoading: boolean;
    error: Error | null;
    data?: T;
    refetch: () => unknown;
  };
  children: (data: T) => React.ReactNode;
}) {
  if (query.isLoading) return <LoadingView />;
  if (query.error)
    return (
      <ErrorView
        message={
          query.error instanceof ApiError
            ? query.error.message
            : "Data gagal dimuat"
        }
        retry={() => void query.refetch()}
      />
    );
  if (Array.isArray(query.data) && query.data.length === 0)
    return (
      <EmptyView
        title="Belum ada data"
        description="Data yang dibuat akan muncul di sini."
      />
    );
  return <>{query.data && children(query.data)}</>;
}
