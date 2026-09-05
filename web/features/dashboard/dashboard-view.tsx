"use client";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  PackageCheck,
  Receipt,
  RefreshCcw,
  ShoppingBag,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { formatRupiah } from "@/lib/currency";
import { ErrorView, LoadingView } from "@/components/shared/status-view";

type DashboardData = {
  metrics: {
    salesToday: number;
    transactionsToday: number;
    averageTransaction: number;
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    comparison: number;
  };
  salesChart: { date: string; total: number }[];
  paymentMethods: { method: string; total: number }[];
  topProducts: { name: string; quantity: number; total: number }[];
  recent: {
    id: string;
    invoiceNumber: string;
    total: string;
    createdAt: string;
    customer: { name: string } | null;
  }[];
};
const methodLabel: Record<string, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer",
  DEBIT_CARD: "Kartu Debit",
  CREDIT_CARD: "Kartu Kredit",
  QRIS_MANUAL: "QRIS",
  OTHER: "Lainnya",
};

export function DashboardView({ goToPos }: { goToPos: () => void }) {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/reports/dashboard").then((r) => r.data),
  });
  if (query.isLoading)
    return <LoadingView label="Menyiapkan ringkasan bisnis..." />;
  if (query.error)
    return (
      <ErrorView
        message={
          query.error instanceof ApiError
            ? query.error.message
            : "Terjadi kesalahan"
        }
        retry={() => void query.refetch()}
      />
    );
  const data = query.data!;
  const metrics = data.metrics;
  const cards = [
    {
      label: "Penjualan hari ini",
      value: formatRupiah(metrics.salesToday),
      detail: `${metrics.comparison >= 0 ? "+" : ""}${metrics.comparison.toFixed(1)}% dari kemarin`,
      icon: Banknote,
      positive: metrics.comparison >= 0,
    },
    {
      label: "Total transaksi",
      value: String(metrics.transactionsToday),
      detail: `Rata-rata ${formatRupiah(metrics.averageTransaction)}`,
      icon: Receipt,
      positive: true,
    },
    {
      label: "Produk aktif",
      value: String(metrics.totalProducts),
      detail: `${metrics.lowStock} stok menipis`,
      icon: PackageCheck,
      positive: metrics.lowStock === 0,
    },
    {
      label: "Stok habis",
      value: String(metrics.outOfStock),
      detail: "Perlu segera ditindak",
      icon: TriangleAlert,
      positive: metrics.outOfStock === 0,
    },
  ];
  return (
    <div className="dashboard-stack">
      <section className="welcome-row">
        <div>
          <span className="eyebrow dark">RABU, 2 SEPTEMBER 2026</span>
          <h1>
            Selamat bekerja, <em>tim MY-CASHIER.</em>
          </h1>
          <p>Berikut ringkasan performa bisnis Anda hari ini.</p>
        </div>
        <div className="welcome-actions">
          <button
            className="button secondary"
            onClick={() => void query.refetch()}
          >
            <RefreshCcw size={17} />
            Perbarui
          </button>
          <button className="button primary" onClick={goToPos}>
            <ShoppingBag size={17} />
            Buka kasir
          </button>
        </div>
      </section>
      <section className="metric-grid">
        {cards.map(({ label, value, detail, icon: Icon, positive }) => (
          <article className="metric-card" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <i>
                <Icon size={19} />
              </i>
            </div>
            <strong>{value}</strong>
            <small className={positive ? "positive" : "warning"}>
              {positive ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}{" "}
              {detail}
            </small>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel chart-panel">
          <div className="panel-head">
            <div>
              <h3>Tren penjualan</h3>
              <p>Performa tujuh hari terakhir</p>
            </div>
            <span className="soft-badge">7 hari</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesChart}>
                <defs>
                  <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00a884" stopOpacity={0.34} />
                    <stop
                      offset="100%"
                      stopColor="#00a884"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#e9eeec"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) =>
                    new Date(v).toLocaleDateString("id-ID", {
                      weekday: "short",
                    })
                  }
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(v: number) => `${v / 1_000_000}jt`}
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#008b70"
                  strokeWidth={2.5}
                  fill="url(#sales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel payment-panel">
          <div className="panel-head">
            <div>
              <h3>Metode pembayaran</h3>
              <p>Distribusi hari ini</p>
            </div>
            <WalletCards size={20} />
          </div>
          {data.paymentMethods.length ? (
            <div className="payment-list">
              {data.paymentMethods.map((item) => {
                const total = data.paymentMethods.reduce(
                  (s, i) => s + i.total,
                  0,
                );
                const percent = total ? (item.total / total) * 100 : 0;
                return (
                  <div key={item.method}>
                    <div>
                      <span>{methodLabel[item.method] || item.method}</span>
                      <strong>{formatRupiah(item.total)}</strong>
                    </div>
                    <div className="progress">
                      <i style={{ width: `${percent}%` }} />
                    </div>
                    <small>{percent.toFixed(0)}%</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="panel-empty">Belum ada transaksi hari ini.</p>
          )}
        </article>
      </section>
      <section className="dashboard-grid lower">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h3>Produk terlaris</h3>
              <p>Berdasarkan 30 hari terakhir</p>
            </div>
          </div>
          <div className="rank-list">
            {data.topProducts.map((item, i) => (
              <div key={item.name}>
                <span className="rank">{i + 1}</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.quantity} item terjual</small>
                </span>
                <b>{formatRupiah(item.total)}</b>
              </div>
            ))}
            {!data.topProducts.length && (
              <p className="panel-empty">Belum ada data produk terlaris.</p>
            )}
          </div>
        </article>
        <article className="panel">
          <div className="panel-head">
            <div>
              <h3>Transaksi terbaru</h3>
              <p>Aktivitas penjualan terkini</p>
            </div>
          </div>
          <div className="recent-list">
            {data.recent.map((sale) => (
              <div key={sale.id}>
                <span className="receipt-icon">
                  <Receipt size={17} />
                </span>
                <span>
                  <strong>{sale.invoiceNumber}</strong>
                  <small>
                    {sale.customer?.name || "Pelanggan umum"} ·{" "}
                    {new Date(sale.createdAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </span>
                <b>{formatRupiah(sale.total)}</b>
              </div>
            ))}
            {!data.recent.length && (
              <p className="panel-empty">Belum ada transaksi hari ini.</p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
