"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { Loader2, Users, Search, X } from "lucide-react";

const formatCurrency = (v: number) => `₦${Number(v || 0).toLocaleString()}`;

interface RiderEntry {
  rider: string;
  deliveries: Array<{
    orderId: string;
    customer: string;
    landmark: string;
    status: string;
    riderPay: number;
    isFailed: boolean;
  }>;
  totalPay: number;
  outstanding: number;
}

export default function RiderPaymentsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [outstandingMap, setOutstandingMap] = useState<Record<string, number>>(
    {},
  );
  const [searchRider, setSearchRider] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(dateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase!
        .from("orders")
        .select("*")
        .not("rider_name", "is", null)
        .gte("rider_assigned_at", startOfDay.toISOString())
        .lte("rider_assigned_at", endOfDay.toISOString())
        .order("rider_assigned_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      toast.error("Failed to load rider data");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const riderGroups = useMemo((): RiderEntry[] => {
    const map: Record<string, RiderEntry> = {};

    for (const order of orders) {
      const rider = order.rider_name || "Unknown";
      if (!map[rider]) {
        map[rider] = {
          rider,
          deliveries: [],
          totalPay: 0,
          outstanding: outstandingMap[rider] || 0,
        };
      }

      const isFailed = order.fom_delivery_status?.toLowerCase() === "failed";
      // For failed deliveries: company charges merchant half the landmark price, rider gets half of what company collected
      // i.e. rider gets 1/2 of (1/2 of landmark) = 1/4 of landmark
      const fullLandmark = Number(order.payment_to_rider || 0);
      const riderPay = isFailed ? Math.round(fullLandmark / 2) : fullLandmark;

      map[rider].deliveries.push({
        orderId: order.id,
        customer: order.customer_name,
        landmark: order.landmark || order.delivery_address || "—",
        status: order.fom_delivery_status || "pending",
        riderPay,
        isFailed,
      });

      map[rider].totalPay += riderPay;
    }

    // Apply outstanding
    return Object.values(map).map((entry) => ({
      ...entry,
      outstanding: outstandingMap[entry.rider] || 0,
    }));
  }, [orders, outstandingMap]);

  const grandTotal = useMemo(
    () => riderGroups.reduce((s, r) => s + r.totalPay - r.outstanding, 0),
    [riderGroups],
  );

  const filteredRiderGroups = useMemo(() => {
    const term = searchRider.trim().toLowerCase();
    if (!term) return riderGroups;
    return riderGroups.filter((r) => r.rider.toLowerCase().includes(term));
  }, [riderGroups, searchRider]);

  const updateOutstanding = (rider: string, value: string) => {
    setOutstandingMap((prev) => ({ ...prev, [rider]: Number(value) || 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rider Payments</h1>
          <p className="text-muted-foreground mt-2">
            Calculate and review how much each rider should be paid based on
            deliveries and failed attempts.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Date:</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 w-44"
            />
          </div>
          {/* Rider search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search rider…"
              value={searchRider}
              onChange={(e) => setSearchRider(e.target.value)}
              className="pl-9 pr-8 h-9 w-48"
            />
            {searchRider && (
              <button
                onClick={() => setSearchRider("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading rider data...
          </p>
        </Card>
      ) : riderGroups.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No rider assignments found for this date.
          </p>
        </Card>
      ) : (
        <>
          {/* Header summary strip */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Company Payout
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(grandTotal)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Riders</p>
              <p className="text-2xl font-bold">{riderGroups.length}</p>
            </div>
          </div>

          {/* Rider Cards */}
          <div className="space-y-4">
            {filteredRiderGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No riders match &ldquo;{searchRider}&rdquo;.
              </div>
            ) : (
              filteredRiderGroups.map((entry) => {
                const netPay = entry.totalPay - entry.outstanding;
                return (
                  <Card key={entry.rider} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-foreground">
                        {entry.rider}
                      </h2>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Net Pay
                          </p>
                          <p className="text-lg font-bold text-emerald-700">
                            {formatCurrency(netPay)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Deliveries table */}
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                              #
                            </th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                              Customer
                            </th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                              Location
                            </th>
                            <th className="text-left p-3 text-xs font-semibold text-muted-foreground">
                              Status
                            </th>
                            <th className="text-right p-3 text-xs font-semibold text-muted-foreground">
                              Rider Pay
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {entry.deliveries.map((d, i) => (
                            <tr
                              key={d.orderId}
                              className={`border-t border-border ${d.isFailed ? "bg-red-50" : ""}`}
                            >
                              <td className="p-3 text-muted-foreground text-xs">
                                {i + 1}
                              </td>
                              <td className="p-3 font-medium">{d.customer}</td>
                              <td className="p-3 text-muted-foreground text-xs">
                                {d.landmark}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${d.isFailed ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                                >
                                  {d.isFailed ? "Failed" : d.status}
                                </span>
                              </td>
                              <td className="p-3 text-right font-semibold">
                                {formatCurrency(d.riderPay)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pay summary */}
                    <div className="rounded-xl bg-muted/20 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Subtotal ({entry.deliveries.length} deliveries)
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(entry.totalPay)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">
                          Outstanding balance
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            ₦
                          </span>
                          <Input
                            type="number"
                            className="h-7 w-28 text-sm"
                            placeholder="0"
                            value={outstandingMap[entry.rider] || ""}
                            onChange={(e) =>
                              updateOutstanding(entry.rider, e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between text-base">
                        <span className="font-bold">Net Amount Payable</span>
                        <span className="font-bold text-emerald-700">
                          {formatCurrency(netPay)}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
