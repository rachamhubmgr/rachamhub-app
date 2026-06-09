"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth-context";
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { supabase } from "@/lib/supabase";
import { Order } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AccountingDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccountingOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase!
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAccountingOrders();
  }, []);

  useSupabaseRealtime(
    [{ table: "orders", event: "*" }],
    fetchAccountingOrders,
    [],
  );

  const totalRevenue = useMemo(
    () =>
      orders
        .filter((o) => (o as any).payment_confirmed === true)
        .reduce((sum, order) => sum + Number(order.total_amount), 0),
    [orders],
  );

  const pendingInvoices = orders.filter(
    (order) =>
      order.fom_delivery_status === "delivered" &&
      (order as any).payment_confirmed !== true,
  ).length;

  const confirmedPayments = orders.filter(
    (order) => (order as any).payment_confirmed === true,
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Accounting Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor financial transactions and billing in real time.
        </p>
      </div>

      {loading ? (
        <Card className="p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading accounting metrics...
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Confirmed Revenue
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  ₦{totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Pending Confirmations
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {pendingInvoices}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-secondary" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Verified Payments
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {confirmedPayments}
                </p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Pending Count
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {pendingInvoices}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-red-600" />
            </div>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Accounting Functions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/dashboard/accounting/invoices"
            className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition"
          >
            <h3 className="font-medium text-foreground">Generate Invoices</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Review delivered orders and update payment status.
            </p>
          </Link>
          <Link
            href="/dashboard/accounting/payments"
            className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition"
          >
            <h3 className="font-medium text-foreground">Payment Tracking</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Keep financial workflows aligned with order delivery.
            </p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
