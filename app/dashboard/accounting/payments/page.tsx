"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Order } from "@/lib/types";
import { Loader2 } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/data-table";
import OrderSearchFilter from "@/components/order-search-filter";

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [foms, setFoms] = useState<any[]>([]);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMerchant, setFilterMerchant] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        { data: ordersData, error: fetchError },
        { data: landmarksData },
        { data: fomUserData },
      ] = await Promise.all([
        supabase!
          .from("orders")
          .select("*")
          .eq("payment_confirmed", true)
          .order("updated_at", { ascending: false }),
        supabase!.from("landmarks").select("*").eq("is_active", true),
        supabase!.from("users").select("id, display_name").eq("role", "fom"),
      ]);

      if (fetchError) {
        throw fetchError;
      }

      setOrders((ordersData ?? []) as Order[]);
      setLandmarks((landmarksData ?? []) as any[]);
      setFoms((fomUserData ?? []) as any[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: DataTableColumn[] = [
    {
      key: "id",
      label: "Order ID",
      render: (row) => `#${String(row.id).split("-")[0]}`,
      getSearchableText: (row) => String(row.id).split("-")[0],
    },
    {
      key: "payment_verified_at",
      label: "Verified At",
      render: (row) =>
        new Date(row.payment_verified_at as string).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        }),
      getSearchableText: (row) =>
        new Date(row.payment_verified_at as string).toLocaleString([], {
          dateStyle: "short",
          timeStyle: "short",
        }),
    },
    {
      key: "customer_name",
      label: "Customer",
      longText: true,
      render: (row) => (row.customer_name as any) || "—",
      getSearchableText: (row) => (row.customer_name as any) || "",
    },
    {
      key: "fom_assigned",
      label: "FOM Assigned",
      render: (row) =>
        foms.find((user) => user.id === (row as any).fom_assigned)
          ?.display_name || "—",
      getSearchableText: (row) =>
        foms.find((user) => user.id === (row as any).fom_assigned)
          ?.display_name || "",
    },
    {
      key: "total_amount",
      label: "Order Amount",
      render: (row) => `₦${Number(row.total_amount || 0).toLocaleString()}`,
      getSearchableText: (row) => String(Number(row.total_amount || 0)),
    },
    {
      key: "landmark",
      label: "Landmark",
      render: (row) => (row.landmark as any) || "—",
      getSearchableText: (row) => (row.landmark as any) || "",
    },
    {
      key: "landmark_price",
      label: "Landmark Price",
      render: (row) =>
        `₦${
          landmarks
            .find((l) => l.name === (row as any).landmark)
            ?.price?.toLocaleString() || "—"
        }`,
      getSearchableText: (row) =>
        String(
          landmarks.find((l) => l.name === (row as any).landmark)?.price || "",
        ),
    },
    {
      key: "rider_name",
      label: "Rider",
      longText: true,
      render: (row) => (row.rider_name as any) || "—",
      getSearchableText: (row) => (row.rider_name as any) || "",
    },
    {
      key: "payment_to_rider",
      label: "Rider Fee",
      render: (row) => `₦${Number(row.payment_to_rider || 0).toLocaleString()}`,
      getSearchableText: (row) => String(Number(row.payment_to_rider || 0)),
    },
    {
      key: "payment_bank",
      label: "Bank",
      render: (row) => (row as any).bank || "—",
      getSearchableText: (row) => (row.bank as any) || "",
    },
    {
      key: "payment_method",
      label: "Payment Method",
      render: (row) => (row as any).payment_method || "—",
      getSearchableText: (row) => (row.payment_method as any) || "",
    },
  ];

  useSupabaseRealtime([{ table: "landmarks", event: "*" }], fetchData, []);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (filterMerchant && order.merchant !== filterMerchant) return false;
      if (!term) return true;
      return (
        (order.customer_name || "").toLowerCase().includes(term) ||
        (order.id || "").toLowerCase().includes(term) ||
        (order.merchant || "").toLowerCase().includes(term)
      );
    });
  }, [orders, searchTerm, filterMerchant]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-2">
          Review confirmed payments and completed orders.
        </p>
      </div>

      {loading ? (
        <Card className="p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading payment records...
          </p>
        </Card>
      ) : error ? (
        <Card className="p-6 bg-destructive/10 text-destructive">{error}</Card>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-6 text-muted-foreground">
          No verified payment records found.
        </Card>
      ) : (
        <Card className="overflow-hidden p-6">
          <DataTable
            headers={columns}
            rows={filteredOrders as any}
            searchPlaceholder="Search payments..."
            merchantOptions={[]}
            filterMerchant={filterMerchant}
            onFilterMerchantChange={setFilterMerchant}
          />
        </Card>
      )}
    </div>
  );
}
