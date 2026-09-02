import { Resend } from "resend";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/app-error.js";
import { createInvoicePdf } from "./pdf.service.js";
import { formatRupiah } from "../utils/money.js";

export async function queueAndSendInvoice(
  saleId: string,
  tenantId: string,
  recipient?: string,
) {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, tenantId },
    include: {
      items: true,
      payments: true,
      customer: true,
      branch: true,
      cashier: true,
    },
  });
  if (!sale) throw new AppError(404, "Transaksi tidak ditemukan", "NOT_FOUND");
  const email = recipient || sale.customer?.email;
  if (!email)
    throw new AppError(422, "Email pelanggan belum tersedia", "EMAIL_REQUIRED");
  const job = await prisma.emailJob.create({
    data: { tenantId, saleId, recipient: email, status: "PENDING" },
  });
  if (!env.RESEND_API_KEY) {
    return prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        attempts: 1,
        lastError: "Resend belum dikonfigurasi",
      },
    });
  }
  try {
    const pdf = await createInvoicePdf(sale);
    const resend = new Resend(env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: email,
      replyTo: env.RESEND_REPLY_TO_EMAIL || undefined,
      subject: `Invoice ${sale.invoiceNumber} — ${sale.branch.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: auto">
          <h1 style="color: #073b4c">${env.APP_NAME}</h1>
          <p>Halo ${sale.customer?.name || "Pelanggan"},</p>
          <p>
            Terima kasih telah berbelanja di ${sale.branch.name}.
            Invoice <strong>${sale.invoiceNumber}</strong> dengan total
            <strong>${formatRupiah(Number(sale.total))}</strong>
            terlampir pada email ini.
          </p>
          <p>Salam,<br />${sale.branch.name}</p>
        </div>
      `,
      text: [
        `Invoice ${sale.invoiceNumber}.`,
        `Total ${formatRupiah(Number(sale.total))}.`,
        `Terima kasih telah berbelanja di ${sale.branch.name}.`,
      ].join(" "),
      attachments: [
        { filename: `invoice-${sale.invoiceNumber}.pdf`, content: pdf },
      ],
    });
    if (result.error) throw new Error(result.error.message);
    return prisma.emailJob.update({
      where: { id: job.id },
      data: { status: "SENT", attempts: 1, providerMessageId: result.data?.id },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 500) : "Pengiriman gagal";
    return prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        attempts: 1,
        lastError: message,
        nextAttemptAt: new Date(Date.now() + 5 * 60_000),
      },
    });
  }
}
