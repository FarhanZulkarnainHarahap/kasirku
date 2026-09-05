"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api-client";

export async function allProducts<T>() {
  const rows: T[] = [];
  for (let page = 1; ; page++) {
    const result = await api<T[]>(`/products?limit=100&page=${page}`);
    rows.push(...result.data);
    if (page >= Number(result.meta.pages || 1)) return rows;
  }
}

export function exportCsv(name: string, rows: unknown[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          let text = String(value ?? "");
          if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
          return '"' + text.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} className="management-dialog" onCancel={close}>
      <header>
        <h2>{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Tutup"
          onClick={close}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}

export function Field({
  label,
  name,
  value,
  type = "text",
  required = false,
  min,
  max,
  step,
  minLength,
  maxLength,
}: {
  label: string;
  name: string;
  value?: string | number | null;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        defaultValue={value ?? ""}
        type={type}
        required={required}
        min={min}
        max={max}
        step={step}
        minLength={minLength}
        maxLength={maxLength}
      />
    </label>
  );
}
