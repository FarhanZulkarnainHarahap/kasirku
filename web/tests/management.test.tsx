import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ProductsView,
  CustomersView,
  SalesView,
} from "@/features/management/management-views";
import { api } from "@/lib/api-client";
vi.mock("@/lib/api-client", () => ({
  api: vi.fn(),
  getApiUrl: () => "https://example.test/api/v1",
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn();
  vi.mocked(api).mockResolvedValue({
    success: true,
    message: "",
    data: [],
    meta: { pages: 1 },
  });
});
function mount(child: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      {child}
    </QueryClientProvider>,
  );
}
describe("Management actions", () => {
  it("sends validated numeric product fields to the API", async () => {
    mount(<ProductsView />);
    fireEvent.click(screen.getByRole("button", { name: "Tambah produk" }));
    fireEvent.change(screen.getByLabelText("Nama produk"), {
      target: { value: "Produk QA" },
    });
    fireEvent.change(screen.getByLabelText("SKU"), {
      target: { value: "QA-001" },
    });
    fireEvent.change(screen.getByLabelText("Harga jual"), {
      target: { value: "12500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        "/products",
        expect.objectContaining({ method: "POST", body: expect.any(String) }),
      ),
    );
    const call = vi
      .mocked(api)
      .mock.calls.find(([, options]) => options?.method === "POST")!;
    expect(JSON.parse(call[1]!.body as string)).toMatchObject({
      name: "Produk QA",
      sku: "QA-001",
      sellingPrice: 12500,
      active: true,
      barcode: null,
    });
  });
  it("shows save errors and keeps the customer form open", async () => {
    vi.mocked(api).mockImplementation(async (_path, options) => {
      if (options?.method === "POST") throw new Error("Email sudah digunakan");
      return { success: true, message: "", data: [], meta: {} };
    });
    mount(<CustomersView />);
    fireEvent.click(screen.getByRole("button", { name: "Tambah pelanggan" }));
    fireEvent.change(screen.getByLabelText("Nama pelanggan"), {
      target: { value: "Pelanggan QA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email sudah digunakan",
    );
    expect(screen.getByLabelText("Nama pelanggan")).toHaveValue("Pelanggan QA");
  });
  it("opens checkout from transaction history", () => {
    const goToPos = vi.fn();
    mount(<SalesView goToPos={goToPos} />);
    fireEvent.click(screen.getByRole("button", { name: "Transaksi baru" }));
    expect(goToPos).toHaveBeenCalledOnce();
  });
});
