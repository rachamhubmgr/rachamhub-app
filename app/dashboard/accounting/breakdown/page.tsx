"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, FileText, Download } from "lucide-react";

const formatCurrency = (v: number) => `₦${Number(v || 0).toLocaleString()}`;

export default function BreakdownPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState("all");
  // 6:01am today cutoff logic
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setHours(6, 1, 0, 0);
    if (new Date() < d) d.setDate(d.getDate() - 1); // use yesterday 6:01am if before today's cutoff
    return d;
  }, []);
  const nextCutoff = useMemo(() => {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + 1);
    return d;
  }, [cutoff]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: merchantData }, { data: orderData }] = await Promise.all([
        supabase!.from("merchants").select("id, name").eq("is_active", true).order("name"),
        supabase!
          .from("orders")
          .select("*, items")
          .gte("created_at", cutoff.toISOString())
          .lt("created_at", nextCutoff.toISOString())
          .order("created_at", { ascending: false }),
      ]);
      if (merchantData) setMerchants(merchantData);
      if (orderData) setOrders(orderData);
    } catch (err) {
      toast.error("Failed to load breakdown data");
    } finally {
      setLoading(false);
    }
  }, [cutoff, nextCutoff]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const merchantsToShow = useMemo(
    () =>
      selectedMerchant === "all"
        ? merchants
        : merchants.filter((m) => m.id === selectedMerchant),
    [merchants, selectedMerchant],
  );

  const ordersByMerchant = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const order of orders) {
      const key = order.merchant || "Unknown";
      if (!map[key]) map[key] = [];
      map[key].push(order);
    }
    return map;
  }, [orders]);

  const isDelivered = (o: any) =>
    o.fom_delivery_status?.toLowerCase() === "delivered";

  const isFailed = (o: any) =>
    o.fom_delivery_status?.toLowerCase() === "failed";

  const handlePrint = (merchantName: string) => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Daily Breakdown</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Daily cutoff: {cutoff.toLocaleString([], { dateStyle: "short", timeStyle: "short" })} —{" "}
            {nextCutoff.toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Filter Merchant:</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={selectedMerchant}
            onChange={(e) => setSelectedMerchant(e.target.value)}
          >
            <option value="all">All Merchants</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading breakdown...</p>
        </Card>
      ) : merchantsToShow.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No merchants found.</p>
        </Card>
      ) : (
        merchantsToShow.map((merchant) => {
          const merchantOrders = ordersByMerchant[merchant.name] || [];
          const delivered = merchantOrders.filter(isDelivered);
          const failed = merchantOrders.filter(isFailed);

          const totalOrderValue = delivered.reduce(
            (s, o) => s + Number(o.total_amount || 0),
            0,
          );
          const totalDeliveryFees = delivered.reduce(
            (s, o) => s + Number(o.payment_to_rider || 0),
            0,
          );
          // Failed delivery: merchant charged half landmark price
          const failedFees = failed.reduce((s, o) => {
            const landmarkPrice = Number(o.payment_to_rider || 0) * 2; // rider was paid half
            return s + Math.round(landmarkPrice / 2);
          }, 0);
          const totalBalance = totalOrderValue - totalDeliveryFees;

          return (
            <Card key={merchant.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {merchant.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {cutoff.toLocaleDateString()} Daily Breakdown
                  </p>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => handlePrint(merchant.name)}>
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>

              {merchantOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No orders in this window.</p>
              ) : (
                <>
                  {/* Delivered Orders */}
                  {delivered.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-600 mb-2">Delivered Orders ({delivered.length})</h3>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Customer</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Location / Fee</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Items / Amount</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {delivered.map((order) => (
                              <tr key={order.id} className="border-t border-border hover:bg-muted/10">
                                <td className="p-3 font-medium">{order.customer_name}</td>
                                <td className="p-3 text-muted-foreground text-xs">
                                  {order.landmark || order.delivery_address || "—"}
                                  {order.payment_to_rider ? ` — ${formatCurrency(order.payment_to_rider)}` : ""}
                                </td>
                                <td className="p-3 text-xs">
                                  {((order.items as any[]) || []).map((item: any) => `${item.quantity}x ${item.name}`).join(", ")}
                                </td>
                                <td className="p-3 text-right font-semibold text-emerald-700">
                                  {formatCurrency(order.total_amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Failed Orders */}
                  {failed.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-red-600 mb-2">Failed Deliveries ({failed.length})</h3>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Customer</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Location</th>
                              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Charge (50%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {failed.map((order) => {
                              const halfFee = Math.round(Number(order.payment_to_rider || 0));
                              return (
                                <tr key={order.id} className="border-t border-border hover:bg-muted/10">
                                  <td className="p-3 font-medium">{order.customer_name}</td>
                                  <td className="p-3 text-muted-foreground text-xs">
                                    {order.landmark || order.delivery_address || "—"}
                                  </td>
                                  <td className="p-3 text-right font-semibold text-red-600">
                                    {formatCurrency(halfFee)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Order Value</span>
                      <span className="font-semibold">{formatCurrency(totalOrderValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Delivery Fees</span>
                      <span className="font-semibold">{formatCurrency(totalDeliveryFees)}</span>
                    </div>
                    {failedFees > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Failed Delivery Charges</span>
                        <span className="font-semibold text-red-600">+{formatCurrency(failedFees)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between text-base">
                      <span className="font-bold">Total Balance Payable</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(totalBalance)}</span>
                    </div>
                  </div>
                </>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
