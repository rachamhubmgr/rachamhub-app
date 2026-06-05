"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Order } from "@/lib/types";
import { Check, Loader2, X, Edit2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import OrderSearchFilter from "@/components/order-search-filter";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  shipped: "Shipped",
  shelved: "Shelved",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-purple-100 text-purple-900",
  shipped: "bg-blue-100 text-blue-900",
  shelved: "bg-yellow-100 text-yellow-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-slate-100 text-slate-900",
  returned: "bg-orange-100 text-orange-900",
};

const PAYMENT_METHODS = ["Cash", "Transfer", "PBD"];
const BANK_OPTIONS = ["UBA", "moniepoint"];

export default function FOMOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMerchant, setFilterMerchant] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Order | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const startEditing = (order: Order) => {
    setEditingId(order.id);
    setEditForm({ ...order });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSave = async () => {
    if (!editForm || !supabase) return;
    setIsSaving(true);
    setError(null);
    console.log({
      payment_method: editForm.payment_method?.toLowerCase(),
      fom_delivery_status: editForm.fom_delivery_status?.toLowerCase(),
      fom_comment: editForm.fom_comment,
      updated_at: new Date().toISOString(),
    });
    try {
      const { error: updateError } = await supabase!
        .from("orders")
        .update({
          payment_method: editForm.payment_method?.toLowerCase(),
          bank: editForm.bank,
          fom_delivery_status: editForm.fom_delivery_status?.toLowerCase(),
          fom_comment: editForm.fom_comment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editForm.id);

      if (updateError) {
        throw updateError;
      }

      setEditingId(null);
      setEditForm(null);
      setIsSaving(false);
      window.setTimeout(() => {
        // Force reload if realtime doesn't refresh immediately
        fetchOrders();
      }, 250);
      toast.success("Order updated successfully.");
    } catch (err) {
      setIsSaving(false);
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to save changes. Please try again.",
      );
    }
  };

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
                  <TableHead>Bank</TableHead>
                  <TableHead>Del. Status</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const isEditing = editingId === order.id;
                  return (
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
                        {isEditing ? (
                          editForm?.payment_method ? (
                            <span className="text-xs text-muted-foreground">
                              {editForm.payment_method}
                            </span>
                          ) : (
                            <select
                              value={editForm?.payment_method ?? ""}
                              onChange={(e) =>
                                setEditForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        payment_method: e.target.value,
                                      }
                                    : prev,
                                )
                              }
                              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                            >
                              <option value="">Select Method</option>
                              {PAYMENT_METHODS.map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          )
                        ) : (
                          (order as any).payment_method || "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {isEditing ? (
                          <select
                            value={editForm?.bank ?? ""}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, bank: e.target.value } : prev,
                              )
                            }
                            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                          >
                            <option value="">Select Bank</option>
                            {BANK_OPTIONS.map((bank) => (
                              <option key={bank} value={bank}>
                                {bank}
                              </option>
                            ))}
                          </select>
                        ) : (
                          (order as any).bank || "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing &&
                        editForm?.fom_delivery_status !== "delivered" ? (
                          <select
                            value={editForm?.fom_delivery_status ?? "pending"}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      fom_delivery_status: e.target.value,
                                    }
                                  : prev,
                              )
                            }
                            className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                          >
                            {Object.entries(STATUS_LABELS).map(
                              ([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ),
                            )}
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase whitespace-nowrap",
                              STATUS_STYLES[
                                order.fom_delivery_status || "pending"
                              ],
                            )}
                          >
                            {order.fom_delivery_status || "pending"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-30 truncate">
                        {isEditing ? (
                          <Textarea
                            value={editForm?.fom_comment ?? ""}
                            placeholder="enter warehouse or delivery notes"
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, fom_comment: e.target.value }
                                  : prev,
                              )
                            }
                            className="min-h-20 text-xs"
                          />
                        ) : (
                          (order as any).fom_comment || "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={handleSave}
                              disabled={isSaving}
                              title="Save"
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-emerald-500" />
                              )}
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={cancelEditing}
                              disabled={isSaving}
                              title="Cancel"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => startEditing(order)}
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
