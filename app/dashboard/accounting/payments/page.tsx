"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Order } from "@/lib/types";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OrderSearchFilter from "@/components/order-search-filter";

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMerchant, setFilterMerchant] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase!
        .from("orders")
        .select("*")
        .eq("payment_confirmed", "Yes")
        .order("updated_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setOrders((data ?? []) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useSupabaseRealtime([{ table: "orders", event: "*" }], fetchPayments, []);

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
        <Card className="overflow-hidden">
          <OrderSearchFilter
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            merchantOptions={[]}
            filterMerchant={filterMerchant}
            onFilterMerchantChange={setFilterMerchant}
          />
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Order Amount</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Verified At</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Payment Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.customer_name}
                  </TableCell>
                  <TableCell>
                    ₦{Number(order.total_amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold text-primary">
                    {(order as any).payment_bank}
                  </TableCell>
                  <TableCell>
                    {new Date(order.updated_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground uppercase">
                    #{order.id.split("-")[0]}
                  </TableCell>
                  <TableCell className="text-xs">
                    {(order as any).payment_method}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
