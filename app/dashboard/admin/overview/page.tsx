"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Package, Users, TrendingUp } from "lucide-react";
import { Order, UserRole } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  returned: "Returned",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OverviewPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        { data: orderData, error: orderError },
        { data: userData, error: userError },
      ] = await Promise.all([
        supabase!.from("orders").select("*"),
        supabase!.from("users").select("id"),
      ]);

      if (orderError || userError) {
        throw orderError ?? userError;
      }

      setOrders((orderData ?? []) as Order[]);
      setUserCount((userData ?? []).length);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard metrics.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase!
      .channel("admin-overview")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        fetchData,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        fetchData,
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, []);

  const statusCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const current = order.status ?? "pending";
        acc[current] = (acc[current] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Overview</h1>
        <p className="text-muted-foreground mt-2">
          Monitor system activity, user access, and order throughput.
        </p>
      </div>

      {loading ? (
        <Card className="p-6 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading overview metrics...
          </p>
        </Card>
      ) : error ? (
        <Card className="p-6 bg-destructive/10 text-destructive">{error}</Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active users</p>
                <p className="text-2xl font-semibold text-foreground">
                  {userCount}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Package className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total orders</p>
                <p className="text-2xl font-semibold text-foreground">
                  {orders.length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Delivered orders
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {statusCounts.delivered ?? 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Payments received
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {statusCounts.paid ?? 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!loading && !error && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground">
            Order status breakdown
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <div
                key={status}
                className="rounded-2xl border border-border p-4"
              >
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {statusCounts[status] ?? 0}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
