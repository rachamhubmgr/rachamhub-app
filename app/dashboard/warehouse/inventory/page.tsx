"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Check, Edit2, Loader2, X } from "lucide-react";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import OrderSearchFilter from "@/components/order-search-filter";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-purple-100 text-purple-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-slate-100 text-slate-900",
  shelved: "bg-amber-100 text-amber-900",
  returned: "bg-orange-100 text-orange-900",
};

export default function InventoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fomUsers, setFomUsers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Order | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeCommentOrderId, setActiveCommentOrderId] = useState<
    string | null
  >(null);
  const [tempComment, setTempComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMerchant, setFilterMerchant] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase!
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setOrders((data ?? []) as Order[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const startEditing = (order: Order) => {
    setEditingId(order.id);
    setEditForm({ ...order });
  };

  const openCommentModal = (orderId: string, currentVal: string) => {
    setActiveCommentOrderId(orderId);
    setTempComment(currentVal);
    setCommentModalOpen(true);
  };

  const handleSaveComment = () => {
    if (
      activeCommentOrderId &&
      editForm &&
      editForm.id === activeCommentOrderId
    ) {
      // Update the editForm's warehouse_comment with the tempComment
      setEditForm((prev) =>
        prev ? { ...prev, warehouse_comment: tempComment } : null,
      );
    }
    setCommentModalOpen(false);
  };

  const handleSave = async () => {
    if (!editForm) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase!
        .from("orders")
        .update({
          status: "warehouse",
          warehouse_delivery_status:
            editForm.warehouse_delivery_status?.toLowerCase(),
          inventory_status: (editForm as any).inventory_status?.toLowerCase(),
          fom_assigned: (editForm as any).fom_assigned,
          warehouse_comment: (editForm as any).warehouse_comment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editForm.id);

      if (updateError) throw updateError;

      setEditingId(null);
      setEditForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchFomUsers = async () => {
      const { data } = await supabase!
        .from("users")
        .select("id, display_name")
        .eq("role", "fom");
      if (data) setFomUsers(data);
    };
    fetchFomUsers();
  }, []);

  useSupabaseRealtime([{ table: "orders", event: "*" }], fetchOrders, []);

  const actionableOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status !== "customer_service" && order.fom_assigned !== null,
      ),
    [orders],
  );

  const filteredActionableOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return actionableOrders.filter((order) => {
      if (filterMerchant && order.merchant !== filterMerchant) return false;
      if (!term) return true;
      return (
        (order.customer_name || "").toLowerCase().includes(term) ||
        (order.delivery_address || "").toLowerCase().includes(term) ||
        (order.merchant || "").toLowerCase().includes(term) ||
        (order.id || "").toLowerCase().includes(term) ||
        (order.phone_numbers || []).join(" ").toLowerCase().includes(term)
      );
    });
  }, [actionableOrders, searchTerm, filterMerchant]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Inventory Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Track stock levels and manage items across orders.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground">Stock summary</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This view aggregates order item quantities so warehouse staff can
          prioritize packing.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Order Inventory Management
          </h2>
          <div className="text-sm text-muted-foreground">
            {actionableOrders.length} orders total
          </div>
        </div>

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
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Inventory Status</TableHead>
                <TableHead>FOM Assigned</TableHead>
                <TableHead>Warehouse Comment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionableOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={16}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No orders match the selected status.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActionableOrders.map((order) => {
                  const isEditing = editingId === order.id;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-[10px] uppercase">
                        #{order.id.split("-")[0]}
                      </TableCell>
                      <TableCell className="text-xs">
                        {order.customer_name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {order.items
                          ?.map((i) => `${i.quantity}x ${i.name}`)
                          .join(", ")}
                      </TableCell>
                      <TableCell className="text-xs">
                        {order.merchant}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <select
                            value={
                              editForm?.warehouse_delivery_status || "pending"
                            }
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      warehouse_delivery_status: e.target
                                        .value as any,
                                    }
                                  : null,
                              )
                            }
                            className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-[11px]"
                          >
                            <option value="pending">Pending</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="shelved">Shelved</option>
                            <option value="returned">Returned</option>
                          </select>
                        ) : (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase whitespace-nowrap",
                              STATUS_STYLES[
                                order.warehouse_delivery_status || "pending"
                              ],
                            )}
                          >
                            {order.warehouse_delivery_status || "pending"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs whitespace-nowrap">
                          {(order as any).inventory_status || "Unpacked"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs whitespace-nowrap">
                          {fomUsers.find(
                            (u) => u.id === (order as any).fom_assigned,
                          )?.display_name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            className="h-8 text-xs cursor-pointer"
                            value={(editForm as any)?.warehouse_comment || ""}
                            readOnly
                            onClick={() =>
                              openCommentModal(
                                order.id,
                                (editForm as any)?.warehouse_comment || "",
                              )
                            }
                          />
                        ) : (
                          <span className="text-xs truncate block max-w-30">
                            {(order as any).warehouse_comment || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={handleSave}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4 text-emerald-500" />
                                )}
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing(order)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent className="sm:max-w-131.25">
          <DialogHeader>
            <DialogTitle>Edit Warehouse Comment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Enter detailed warehouse comment..."
              className="min-h-37.5"
              value={tempComment}
              onChange={(e) => setTempComment(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCommentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveComment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
