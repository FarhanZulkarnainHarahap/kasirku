"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  ChevronDown,
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
} from "lucide-react";
import type { User } from "@/types/api";

export type View =
  "dashboard" | "pos" | "products" | "inventory" | "customers" | "sales";
const navigation: { id: View; label: string; icon: typeof LayoutDashboard }[] =
  [
    { id: "dashboard", label: "Ringkasan", icon: LayoutDashboard },
    { id: "pos", label: "Kasir", icon: ShoppingCart },
    { id: "products", label: "Produk", icon: Package },
    { id: "inventory", label: "Stok & Inventori", icon: Boxes },
    { id: "customers", label: "Pelanggan", icon: Users },
    { id: "sales", label: "Transaksi", icon: ReceiptText },
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
  const [online, setOnline] = useState(true);
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
    <div className="app-layout">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark">
              <Store size={21} />
            </span>
            <span>
              NEXXUS <b>POS</b>
            </span>
          </div>
          <button
            className="icon-button mobile-only"
            onClick={() => setMobile(false)}
          >
            <X />
          </button>
        </div>
        <div className="workspace">
          <span className="workspace-logo">NT</span>
          <span>
            <small>Ruang kerja</small>
            <strong>Nexxus Mart</strong>
          </span>
          <ChevronDown size={16} />
        </div>
        <nav>
          <span className="nav-label">MENU UTAMA</span>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => {
                setView(id);
                setMobile(false);
              }}
            >
              <Icon size={19} />
              {label}
              {id === "pos" && <span className="key-hint">F2</span>}
            </button>
          ))}
          <span className="nav-label second">ANALISIS</span>
          <button>
            <BarChart3 size={19} />
            Laporan
          </button>
          <button>
            <Settings size={19} />
            Pengaturan
          </button>
        </nav>
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
            onClick={() => setMobile(true)}
          >
            <Menu />
          </button>
          <div>
            <span className="breadcrumb">NEXXUS POS / {current.label}</span>
            <h2>{current.label}</h2>
          </div>
          <div className="top-actions">
            {!online && <span className="offline-pill">Offline</span>}
            <div className="global-search">
              <Search size={17} />
              <input placeholder="Cari apa saja..." />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button bell">
              <Bell size={19} />
              <i />
            </button>
            <div className="branch-pill">
              <span>NT</span>
              <div>
                <small>Cabang aktif</small>
                <strong>Medan Utama</strong>
              </div>
              <ChevronDown size={15} />
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
