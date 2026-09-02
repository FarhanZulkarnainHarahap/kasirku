"use client";
import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import type { User } from "@/types/api";

export function LoginForm({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("cashier@nexxuspos.test");
  const [password, setPassword] = useState("Cashier123!");
  const [show, setShow] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      api<User>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: (result) => onLogin(result.data),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };
  return (
    <main className="login-page">
      <section className="login-story">
        <div className="brand light">
          <span className="brand-mark">
            <Store size={24} />
          </span>
          <span>
            NEXXUS <b>POS</b>
          </span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">
            <ShieldCheck size={15} /> Operasional toko dalam satu kendali
          </span>
          <h1>
            Transaksi lebih cepat.
            <br />
            <em>Bisnis lebih terkendali.</em>
          </h1>
          <p>
            Kelola kasir, stok, pelanggan, dan performa setiap cabang dari satu
            sistem yang aman.
          </p>
        </div>
        <div className="trust-row">
          <span>Multi-cabang</span>
          <span>Stok real-time</span>
          <span>Offline ready</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <span className="brand-mark">
              <Store size={20} />
            </span>
            NEXXUS POS
          </div>
          <span className="overline">SELAMAT DATANG</span>
          <h2>Masuk ke ruang kerja</h2>
          <p className="muted">
            Gunakan akun yang telah didaftarkan oleh pemilik bisnis.
          </p>
          <form onSubmit={submit}>
            <label>Email</label>
            <div className="input-shell">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="label-row">
              <label>Kata sandi</label>
              <button type="button" className="link-button">
                Lupa kata sandi?
              </button>
            </div>
            <div className="input-shell">
              <LockKeyhole size={18} />
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={8}
                required
              />
              <button
                type="button"
                aria-label="Tampilkan kata sandi"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mutation.error && (
              <div className="form-error">
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : "Gagal masuk"}
              </div>
            )}
            <button
              className="button primary login-submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <>
                  <LoaderCircle className="spin" size={18} />
                  Memeriksa akun...
                </>
              ) : (
                <>
                  Masuk ke NEXXUS POS <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p className="login-help">
            Butuh bantuan? Hubungi administrator bisnis Anda.
          </p>
        </div>
      </section>
    </main>
  );
}
