"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { LoginForm } from "@/features/auth/login-form";
import { AppShell, type View } from "@/components/layout/app-shell";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { PosView } from "@/features/pos/pos-view";
import {
  CustomersView,
  InventoryView,
  ProductsView,
  SalesView,
} from "@/features/management/management-views";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/api";
export function HomeClient() {
  const [view, setView] = useState<View>("dashboard");
  const auth = useAuthStore();
  const client = useQueryClient();
  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => api<User>("/auth/me").then((r) => r.data),
    retry: false,
    enabled: !auth.user,
  });
  const user = auth.user || session.data || null;
  const logout = useMutation({
    mutationFn: () => api<null>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      auth.setUser(null);
      client.clear();
    },
  });
  if (!user)
    return (
      <LoginForm
        onLogin={(value) => {
          auth.setUser(value);
          client.setQueryData(["session"], value);
        }}
      />
    );
  const views = {
    dashboard: <DashboardView goToPos={() => setView("pos")} />,
    pos: <PosView />,
    products: <ProductsView />,
    inventory: <InventoryView />,
    customers: <CustomersView />,
    sales: <SalesView />,
  };
  return (
    <AppShell
      user={user}
      view={view}
      setView={setView}
      logout={() => logout.mutate()}
    >
      {views[view]}
    </AppShell>
  );
}
