import { describe, expect, it } from "vitest";
import {
  calculateChange,
  calculateSubtotal,
  calculateTax,
  formatRupiah,
  roundMoney,
} from "../src/utils/money.js";
import { invoiceNumber } from "../src/utils/invoice.js";
import { rolePermissions } from "../src/service/auth.service.js";

describe("perhitungan uang", () => {
  it("menghitung subtotal dan diskon tanpa floating point liar", () => {
    expect(calculateSubtotal(10_000, 3, 2_500)).toBe(27_500);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
  it("menghitung pajak dan kembalian", () => {
    expect(calculateTax(100_000, 11)).toBe(11_000);
    expect(calculateChange(150_000, 111_000)).toBe(39_000);
  });
  it("memformat rupiah", () => {
    expect(formatRupiah(125_000)).toContain("125.000");
  });
});
describe("nomor invoice", () => {
  it("memakai kode cabang, tanggal, dan sequence", () => {
    expect(invoiceNumber("mdn", 7, new Date("2026-09-01T06:00:00Z"))).toBe(
      "INV-MDN-20260901-00007",
    );
  });
});
describe("permission", () => {
  it("membatasi kasir dan memberi owner akses penuh", () => {
    expect(rolePermissions.CASHIER).toContain("sales.create");
    expect(rolePermissions.CASHIER).not.toContain("reports.export");
    expect(rolePermissions.OWNER).toContain("*");
  });
});
