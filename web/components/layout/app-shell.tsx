"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Users,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Wifi,
} from "lucide-react";
import type { User } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Branch } from "@/features/management/reports-settings";

export type View =
  | "dashboard"
  | "pos"
  | "products"
  | "inventory"
  | "customers"
  | "sales"
  | "reports"
  | "settings";
const navigation: { id: View; label: string; icon: typeof LayoutDashboard }[] =
  [
    { id: "dashboard", label: "Ringkasan", icon: LayoutDashboard },
    { id: "pos", label: "Kasir", icon: ShoppingCart },
    { id: "products", label: "Produk", icon: Package },
    { id: "inventory", label: "Stok & Inventori", icon: Boxes },
    { id: "customers", label: "Pelanggan", icon: Users },
    { id: "sales", label: "Transaksi", icon: ReceiptText },
    { id: "reports", label: "Laporan", icon: BarChart3 },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];
export function AppShell({
  user,
  view,
  setView,
  logout,
  children,
}: {
  user: User;
  view: View;
  setView: (view: View) => void;
  logout: () => void;
  children: ReactNode;
}) {
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [online, setOnline] = useState(true);
  const [search, setSearch] = useState("");
  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => api<Branch[]>("/branches").then((r) => r.data),
  });
  const branch = branches.data?.find((x) => x.id === user.branchId);
  const current = navigation.find((item) => item.id === view)!;
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <div className={`app-layout ${collapsed ? "rail-layout" : ""}`}>
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark">
              <Store size={21} />
            </span>
            <span className="brand-name">
              kasirku<span className="brand-dot">.</span>
            </span>
          </div>
          <button
            className="icon-button mobile-only"
            aria-label="Tutup menu"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace">
          <span className="workspace-logo">
            <Store size={18} />
          </span>
          <span>
            <small>Ruang kerja</small>
            <strong>{branch?.name || "Kasirku Mart"}</strong>
          </span>
        </div>
        <nav>
          <span className="nav-label">MENU UTAMA</span>
          {navigation
            .filter(
              (item) =>
                !["dashboard", "reports"].includes(item.id) ||
                user.role === "OWNER" ||
                user.permissions.includes("reports.view"),
            )
            .map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                title={label}
                aria-current={view === id ? "page" : undefined}
                className={view === id ? "active" : ""}
                onClick={() => {
                  setView(id);
                  setMobile(false);
                }}
              >
                <Icon size={19} />
                <span className="nav-text">{label}</span>
              </button>
            ))}
        </nav>
        <button
          className="rail-toggle"
          title={collapsed ? "Perluas navigasi" : "Ringkas navigasi"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
          <span className="nav-text">Ringkas navigasi</span>
        </button>
        <div className="sidebar-user">
          <CircleUserRound size={34} />
          <span>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </span>
          <button onClick={logout} title="Keluar">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="scrim"
          onClick={() => setMobile(false)}
          aria-label="Tutup menu"
        />
      )}
      <section className="workspace-main">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            aria-label="Buka menu"
            aria-expanded={mobile}
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <div>
            <span className="breadcrumb">
              Ruang kerja / <strong>{current.label}</strong>
            </span>
            <h2>{current.label}</h2>
          </div>
          <div className="top-actions">
            <span className={`connection-status ${online ? "" : "is-offline"}`}>
              <Wifi size={14} />
              {online ? "Online" : "Offline"}
            </span>
            <div className="global-search">
              <Search size={17} />
              <input
                aria-label="Cari menu"
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <div className="menu-results">
                  {navigation
                    .filter(
                      (x) =>
                        x.label.toLowerCase().includes(search.toLowerCase()) &&
                        (!["dashboard", "reports"].includes(x.id) ||
                          user.role === "OWNER" ||
                          user.permissions.includes("reports.view")),
                    )
                    .map((x) => (
                      <button
                        key={x.id}
                        onClick={() => {
                          setView(x.id);
                          setSearch("");
                        }}
                      >
                        {x.label}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <button
              className="icon-button bell"
              title="Lihat stok menipis"
              onClick={() => setView("inventory")}
            >
              <Bell size={19} />
              <i />
            </button>
            <div className="branch-pill">
              <span>
                <Store size={16} />
              </span>
              <div>
                <small>Cabang aktif</small>
                <strong>{branch?.name || "Semua cabang"}</strong>
              </div>
            </div>
          </div>
        </header>
        <main className={view === "pos" ? "content pos-content" : "content"}>
          {children}
        </main>
      </section>
    </div>
  );
}
