export const invoiceNumber = (
  branchCode: string,
  sequence: number,
  date = new Date(),
) => {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("-", "");
  return `INV-${branchCode.toUpperCase()}-${stamp}-${String(sequence).padStart(5, "0")}`;
};
