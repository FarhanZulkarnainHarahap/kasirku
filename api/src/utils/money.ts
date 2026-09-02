export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export const calculateSubtotal = (
  price: number,
  quantity: number,
  discount = 0,
) => roundMoney(Math.max(0, price * quantity - discount));
export const calculateTax = (subtotal: number, rate: number) =>
  roundMoney((subtotal * rate) / 100);
export const calculateChange = (paid: number, total: number) =>
  roundMoney(Math.max(0, paid - total));
export const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
