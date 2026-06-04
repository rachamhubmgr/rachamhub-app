"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Order, OrderStatus } from "@/lib/types";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import OrderSearchFilter from "@/components/order-search-filter";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  shipped: "Ready for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-purple-100 text-purple-900",
  shipped: "bg-blue-100 text-blue-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-slate-100 text-slate-900",
  returned: "bg-orange-100 text-orange-900",
};

export default function FOMOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMerchant, setFilterMerchant] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase!
        .from("orders")
        .select("*")
        .eq("fom_assigned", user.uid)
        .eq("status", "fom")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setOrders((data ?? []) as Order[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load FOM orders.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useSupabaseRealtime([{ table: "orders", event: "*" }], fetchOrders, [
    user?.uid,
  ]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      if (filterMerchant && order.merchant !== filterMerchant) return false;
      if (!term) return true;
      return (
        (order.customer_name || "").toLowerCase().includes(term) ||
        (order.delivery_address || "").toLowerCase().includes(term) ||
        (order.merchant || "").toLowerCase().includes(term) ||
        (order.id || "").toLowerCase().includes(term)
      );
    });
  }, [orders, searchTerm, filterMerchant]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground mt-2">
          History of fulfillment orders processed and completed.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              FOM workflow
            </h2>
            <p className="text-sm text-muted-foreground">
              Progress orders from packing to delivered status.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm text-foreground">
            {filteredOrders.length} active order
            {filteredOrders.length === 1 ? "" : "s"}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading orders...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No processed orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <OrderSearchFilter
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              merchantOptions={[]}
              filterMerchant={filterMerchant}
              onFilterMerchantChange={setFilterMerchant}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Rider</TableHead>
                  <TableHead>Landmark</TableHead>
                  <TableHead>Price (₦)</TableHead>
                  <TableHead>Pay Method</TableHead>
                  <TableHead>Del. Status</TableHead>
                  <TableHead>Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs font-medium">
                      {order.customer_name}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground max-w-37.5 truncate">
                      {order.delivery_address}
                    </TableCell>
                    <TableCell className="text-xs">
                      {order.items
                        ?.map((i) => `${i.quantity}x ${i.name}`)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {(order as any).rider_name || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {(order as any).landmark || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      ₦
                      {Number(
                        (order as any).price_with_rider || 0,
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {(order as any).payment_method || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase whitespace-nowrap",
                          STATUS_STYLES[order.fom_delivery_status || "pending"],
                        )}
                      >
                        {order.fom_delivery_status || "pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs max-w-30 truncate">
                      {(order as any).fom_comment || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
