import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Prisma } from "../../prisma/generated/prisma/client.js";
import { formatRupiah } from "../utils/money.js";

type InvoiceSale = Prisma.SaleGetPayload<{
  include: {
    items: true;
    payments: true;
    customer: true;
    branch: true;
    cashier: true;
  };
}>;
export async function createInvoicePdf(sale: InvoiceSale) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  page.drawText("MY-CASHIER", {
    x: 48,
    y: 790,
    size: 22,
    font: bold,
    color: rgb(0.02, 0.18, 0.25),
  });
  page.drawText("INVOICE", { x: 455, y: 790, size: 18, font: bold });
  page.drawText(sale.invoiceNumber, {
    x: 390,
    y: 767,
    size: 10,
    font: regular,
  });
  page.drawText(sale.branch.name, { x: 48, y: 750, size: 11, font: bold });
  page.drawText(sale.branch.address || "", {
    x: 48,
    y: 734,
    size: 9,
    font: regular,
  });
  page.drawText(`Kasir: ${sale.cashier.name}`, {
    x: 48,
    y: 700,
    size: 10,
    font: regular,
  });
  page.drawText(`Pelanggan: ${sale.customer?.name || "Umum"}`, {
    x: 300,
    y: 700,
    size: 10,
    font: regular,
  });
  let y = 660;
  page.drawRectangle({
    x: 45,
    y: y - 8,
    width: 505,
    height: 26,
    color: rgb(0.9, 0.96, 0.95),
  });
  page.drawText("Produk", { x: 52, y, size: 10, font: bold });
  page.drawText("Qty", { x: 345, y, size: 10, font: bold });
  page.drawText("Subtotal", { x: 445, y, size: 10, font: bold });
  y -= 30;
  for (const item of sale.items.slice(0, 24)) {
    page.drawText(item.productName.slice(0, 42), {
      x: 52,
      y,
      size: 9,
      font: regular,
    });
    page.drawText(String(item.quantity), { x: 350, y, size: 9, font: regular });
    page.drawText(formatRupiah(Number(item.subtotal)), {
      x: 430,
      y,
      size: 9,
      font: regular,
    });
    y -= 21;
  }
  y -= 10;
  page.drawText("Total", { x: 365, y, size: 12, font: bold });
  page.drawText(formatRupiah(Number(sale.total)), {
    x: 430,
    y,
    size: 12,
    font: bold,
  });
  page.drawText("Terima kasih telah berbelanja.", {
    x: 48,
    y: 65,
    size: 9,
    font: regular,
    color: rgb(0.35, 0.4, 0.42),
  });
  return Buffer.from(await pdf.save());
}
