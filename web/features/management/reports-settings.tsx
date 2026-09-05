"use client";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { formatRupiah } from "@/lib/currency";
import { ErrorView, LoadingView } from "@/components/shared/status-view";
import { exportCsv, Field } from "./controls";
import type { User } from "@/types/api";

type Report = {
  summary: {
    _sum: { total: string | null; discount: string | null; tax: string | null };
    _count: number;
    _avg: { total: string | null };
  };
  payments: { method: string; _sum: { amount: string | null } }[];
  products: {
    productId: string;
    productName: string;
    _sum: { quantity: number | null; subtotal: string | null };
  }[];
};
export function ReportsView() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [from, setFrom] = useState(today.slice(0, 7) + "-01");
  const [to, setTo] = useState(today);
  const query = useQuery({
    queryKey: ["reports", from, to],
    queryFn: () =>
      api<Report>("/reports/sales?from=" + from + "&to=" + to).then(
        (r) => r.data,
      ),
    enabled: !!from && !!to && from <= to,
  });
  const rows = [
    ["Produk", "Jumlah", "Subtotal"],
    ...(query.data?.products.map((p) => [
      p.productName,
      p._sum.quantity,
      p._sum.subtotal,
    ]) || []),
  ];
  return (
    <div>
      <section className="module-header">
        <h1>Laporan penjualan</h1>
        <button
          className="button secondary"
          disabled={!query.data || query.isFetching || from > to}
          onClick={() =>
            exportCsv("laporan-" + from + "-" + to, [
              ["Periode", from, to],
              ["Total penjualan", query.data?.summary._sum.total],
              ["Transaksi", query.data?.summary._count],
              ["Pajak", query.data?.summary._sum.tax],
              ["Diskon", query.data?.summary._sum.discount],
              ...rows,
            ])
          }
        >
          <Download size={17} />
          Ekspor CSV
        </button>
      </section>
      <div className="report-dates">
        <label>
          Dari
          <input
            aria-label="Dari"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Sampai
          <input
            aria-label="Sampai"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <span>WIB</span>
      </div>
      {!from || !to || from > to ? (
        <p role="alert">Pilih rentang tanggal yang valid.</p>
      ) : query.isLoading ? (
        <LoadingView />
      ) : query.error ? (
        <ErrorView
          message={query.error.message}
          retry={() => void query.refetch()}
        />
      ) : (
        query.data && (
          <>
            <div className="report-totals">
              <div>
                Total penjualan
                <strong>
                  {formatRupiah(query.data.summary._sum.total || 0)}
                </strong>
              </div>
              <div>
                Transaksi<strong>{query.data.summary._count}</strong>
              </div>
              <div>
                Rata-rata transaksi
                <strong>
                  {formatRupiah(query.data.summary._avg.total || 0)}
                </strong>
              </div>
            </div>
            <h2>Penjualan produk</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {rows[0].map((v) => (
                      <th key={v}>{v}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {query.data.products.map((p) => (
                    <tr key={p.productId}>
                      <td>{p.productName}</td>
                      <td>{p._sum.quantity}</td>
                      <td>{formatRupiah(p._sum.subtotal || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!query.data.products.length && (
              <p>Belum ada penjualan pada periode ini.</p>
            )}
            <h2>Pembayaran diterima</h2>
            {query.data.payments.map((p) => (
              <p key={p.method}>
                {p.method}: {formatRupiah(p._sum.amount || 0)}
              </p>
            ))}
          </>
        )
      )}
    </div>
  );
}
export type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  invoicePrefix: string;
  receiptSize: number;
  allowNegativeStock: boolean;
  allowCashWithoutShift: boolean;
};
export function SettingsView({ user }: { user: User }) {
  const [selected, setSelected] = useState("");
  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => api<Branch[]>("/branches").then((r) => r.data),
  });
  const branch =
    branches.data?.find((x) => x.id === (selected || user.branchId)) ||
    branches.data?.[0];
  return (
    <div>
      <section className="module-header">
        <h1>Pengaturan</h1>
      </section>
      <p>
        {user.name} ({user.email})
      </p>
      {branches.isLoading ? (
        <LoadingView />
      ) : branches.error ? (
        <ErrorView
          message={branches.error.message}
          retry={() => void branches.refetch()}
        />
      ) : (
        <>
          <label>
            Cabang
            <select
              aria-label="Cabang"
              value={branch?.id || ""}
              onChange={(e) => setSelected(e.target.value)}
            >
              {branches.data?.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          {branch ? (
            <BranchForm
              key={branch.id + JSON.stringify(branch)}
              branch={branch}
              editable={
                user.role === "OWNER" ||
                user.permissions.includes("settings.manage")
              }
            />
          ) : (
            <p>Belum ada cabang.</p>
          )}
        </>
      )}
    </div>
  );
}
function BranchForm({
  branch,
  editable,
}: {
  branch: Branch;
  editable: boolean;
}) {
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api("/branches/" + branch.id, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Pengaturan disimpan");
    },
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data: Record<string, unknown> = Object.fromEntries(f);
    for (const k of ["email", "address", "phone"]) data[k] = data[k] || null;
    data.receiptSize = Number(data.receiptSize);
    for (const k of ["allowNegativeStock", "allowCashWithoutShift"])
      data[k] = f.get(k) === "on";
    save.mutate(data);
  }
  return (
    <form className="management-form settings-form" onSubmit={submit}>
      <fieldset disabled={!editable || save.isPending}>
        <Field
          label="Nama cabang"
          name="name"
          value={branch.name}
          required
          minLength={2}
          maxLength={150}
        />
        <Field
          label="Alamat"
          name="address"
          value={branch.address}
          maxLength={500}
        />
        <Field
          label="Telepon"
          name="phone"
          value={branch.phone}
          maxLength={30}
        />
        <Field label="Email" name="email" type="email" value={branch.email} />
        <Field
          label="Awalan invoice"
          name="invoicePrefix"
          value={branch.invoicePrefix}
          required
          maxLength={15}
        />
        <label>
          Ukuran struk
          <select name="receiptSize" defaultValue={branch.receiptSize}>
            <option value={58}>58 mm</option>
            <option value={80}>80 mm</option>
          </select>
        </label>
        <label className="checkbox-field">
          <input
            name="allowNegativeStock"
            type="checkbox"
            defaultChecked={branch.allowNegativeStock}
          />
          Izinkan stok negatif
        </label>
        <label className="checkbox-field">
          <input
            name="allowCashWithoutShift"
            type="checkbox"
            defaultChecked={branch.allowCashWithoutShift}
          />
          Izinkan tunai tanpa shift
        </label>
      </fieldset>
      {save.error && (
        <p role="alert" className="form-error">
          {save.error.message}
        </p>
      )}
      {editable && (
        <button className="button primary" disabled={save.isPending}>
          <Save size={17} />
          {save.isPending ? "Menyimpan..." : "Simpan pengaturan"}
        </button>
      )}
    </form>
  );
}
