"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

export default function InvoicesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifications, setVerifications] = useState<
    Record<string, { confirmed: string; bank: string }>
  >({});

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase!
        .from("orders")
        .select("*")
        .eq("delivery_status", "delivered")
        .in("payment_method", ["Cash", "Transfer"])
        .neq("payment_confirmed", "Yes")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setOrders((data ?? []) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load invoices.");
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (orderId: string) => {
    const verify = verifications[orderId];
    if (!verify?.confirmed || !verify?.bank) {
      toast.error("Please select both Confirmed status and Bank account.");
      return;
    }

    setActionLoading(orderId);

    try {
      const { error: updateError } = await supabase!
        .from("orders")
        .update({
          payment_confirmed: verify.confirmed,
          payment_bank: verify.bank,
          status: verify.confirmed === "Yes" ? "paid" : "fom",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) {
        throw updateError;
      }

      toast.success("Payment verified successfully");
      await fetchInvoices();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to update payment status.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchInvoices();
    const channel = supabase!
      .channel("accounting-invoices")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchInvoices(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateVerify = (
    orderId: string,
    field: "confirmed" | "bank",
    value: string,
  ) => {
    setVerifications((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || { confirmed: "", bank: "" }),
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
        <p className="text-muted-foreground mt-2">
          Review orders ready for invoicing and payment.
        </p>
      </div>

      {loading ? (
        <Card className="p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading invoices...
          </p>
        </Card>
      ) : error ? (
        <Card className="p-6 bg-destructive/10 text-destructive">{error}</Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Order Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Payment by Merchant</TableHead>
                <TableHead>Confirmed</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="py-10 text-center text-muted-foreground"
                  >
                    There are no invoices to review right now.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="text-xs">
                      {order.customer_name}
                    </TableCell>
                    <TableCell className="text-xs">
                      {order.items?.map((i) => i.name).join(", ")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {order.items?.reduce((acc, i) => acc + i.quantity, 0)}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      ₦{Number(order.total_amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-primary">
                      {(order as any).payment_method}
                    </TableCell>
                    <TableCell className="text-xs">
                      ₦
                      {Number(
                        (order as any).payment_by_merchant || 0,
                      ).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <select
                        className="h-8 w-24 rounded-md border border-input bg-background px-2 text-[11px]"
                        value={verifications[order.id]?.confirmed || ""}
                        onChange={(e) =>
                          updateVerify(order.id, "confirmed", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <select
                        className="h-8 w-28 rounded-md border border-input bg-background px-2 text-[11px]"
                        value={verifications[order.id]?.bank || ""}
                        onChange={(e) =>
                          updateVerify(order.id, "bank", e.target.value)
                        }
                      >
                        <option value="">Select Bank</option>
                        <option value="UBA">UBA</option>
                        <option value="Moniepoint">Moniepoint</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => confirmPayment(order.id)}
                        disabled={actionLoading === order.id}
                      >
                        {actionLoading === order.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Confirm"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
