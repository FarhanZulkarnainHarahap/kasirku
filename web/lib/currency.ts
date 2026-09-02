export const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
export const formatRupiah = (value: number | string) =>
  rupiah.format(Number(value));
