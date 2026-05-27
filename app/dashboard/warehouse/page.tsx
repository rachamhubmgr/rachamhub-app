"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Order, OrderStatus } from "@/lib/types";
import { Check, Edit2, Loader2, Package, X } from "lucide-react";
import { toast } from "sonner";
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

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  delivered: "Delivered",
  cancelled: "Cancelled",
  shelved: "Shelved",
  returned: "Returned",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-purple-100 text-purple-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-slate-100 text-slate-900",
  shelved: "bg-amber-100 text-amber-900",
  returned: "bg-orange-100 text-orange-900",
};

const printTicket = (order: Order) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const itemsHtml =
    order.items
      ?.map(
        (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
    </tr>
  `,
      )
      .join("") || "";

  printWindow.document.write(`
    <html>
      <head>
        <title>Order Ticket - ${order.id.split("-")[0]}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
          .ticket { border: 2px solid #000; padding: 20px; max-width: 500px; margin: auto; }
          h1 { text-align: center; margin-top: 0; font-size: 1.4rem; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .field { margin-bottom: 10px; font-size: 1rem; }
          .label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { border-bottom: 2px solid #000; text-align: left; padding: 8px; }
          .total { margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; font-size: 1.2rem; font-weight: bold; text-align: right; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <h1>RACHAMHUB LOGISTICS TICKET</h1>
          <div class="field"><span class="label">Order ID:</span> #${order.id.split("-")[0].toUpperCase()}</div>
          <div class="field"><span class="label">Customer:</span> ${order.customer_name}</div>
          <div class="field"><span class="label">Phone:</span> ${order.phone_numbers?.join(", ") || "-"}</div>
          <div class="field"><span class="label">Address:</span> ${order.delivery_address}</div>
          
          <table>
            <thead>
              <tr><th>Product Name</th><th style="text-align:center">Qty</th></tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="total">Total Amount: ₦${Number(order.total_amount).toLocaleString()}</div>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export default function WarehouseOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fomUsers, setFomUsers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Order | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeCommentOrderId, setActiveCommentOrderId] = useState<
    string | null
  >(null);
  const [tempComment, setTempComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFormValid = (form: Order | null) => {
    if (!form) return false;
    const f = form as any;
    return (
      f.fom_assigned &&
      f.inventory_status !== "Unpacked" &&
      f.delivery_status !== "pending"
    );
  };

  const fetchOrders = async () => {
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

      console.log(data);

      setOrders((data ?? []) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchOrders();

    // Fetch all users with the 'fom' role to use for display mapping and dropdown
    const fetchFomUsers = async () => {
      const { data } = await supabase!
        .from("users")
        .select("id, display_name")
        .eq("role", "fom");
      if (data) setFomUsers(data);
    };
    fetchFomUsers();

    const channel = supabase!
      .channel("warehouse-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders(),
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, []);

  const handleSave = async () => {
    if (!editForm || !supabase) return;

    setIsSaving(true);
    setError(null);

    if (!isFormValid(editForm)) {
      toast.warning("Incomplete Update", {
        description:
          "Please assign an FOM and update both Delivery and Inventory statuses before saving.",
      });
      setIsSaving(false);
      return;
    }

    const assignedFom = (editForm as any).fom_assigned;
    const validFomId = fomUsers.find((u) => u.id === assignedFom)?.id || null;

    try {
      const { error: updateError } = await supabase!
        .from("orders")
        .update({
          status: "warehouse",
          delivery_status: editForm.delivery_status,
          inventory_status: (editForm as any).inventory_status,
          fom_assigned: validFomId,
          warehouse_comment: (editForm as any).warehouse_comment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editForm.id);

      if (updateError) {
        console.log(updateError);
        throw updateError;
      }

      const updatedOrder = { ...editForm };
      setEditingId(null);
      setEditForm(null);

      printTicket(updatedOrder as Order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setIsSaving(false);
    }
  };

  const actionableOrders = useMemo(
    () => orders.filter((order) => order.status === "customer_service"),
    [orders],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Orders for Processing
        </h1>
        <p className="text-muted-foreground mt-2">
          Pick, pack, and advance orders through the warehouse workflow.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Warehouse action queue
            </h2>
            <p className="text-sm text-muted-foreground">
              Pending orders are staged here until they are ready for
              fulfillment.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm text-foreground">
            {orders.length} {orders.length === 1 ? "order" : "orders"} in the
            queue
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
        ) : actionableOrders.length === 0 ? (
          <div className="rounded-xl bg-secondary p-6 text-sm text-secondary-foreground">
            No warehouse orders are waiting for pickup.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">Order ID</TableHead>
                <TableHead className="font-semibold">Date & Time</TableHead>
                <TableHead className="font-semibold">Customer Name</TableHead>
                <TableHead className="font-semibold">
                  Delivery Address
                </TableHead>
                <TableHead className="font-semibold">Phone</TableHead>
                <TableHead className="font-semibold">Product Name</TableHead>
                <TableHead className="font-semibold">Qty</TableHead>
                <TableHead className="font-semibold">Amount (₦)</TableHead>
                <TableHead className="font-semibold">Merchant Name</TableHead>
                <TableHead className="font-semibold text-xs">
                  CC Comment
                </TableHead>
                <TableHead className="font-semibold text-xs whitespace-nowrap">
                  Delivery Status
                </TableHead>
                <TableHead className="font-semibold text-xs whitespace-nowrap">
                  Inventory Status
                </TableHead>
                <TableHead className="font-semibold text-xs whitespace-nowrap">
                  FOM Assigned
                </TableHead>
                <TableHead className="font-semibold text-xs whitespace-nowrap">
                  Warehouse Comment
                </TableHead>
                <TableHead className="font-semibold">Entered By</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
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
                actionableOrders.map((order) => {
                  const isEditing = editingId === order.id;
                  return (
                    <TableRow
                      key={order.id}
                      className={isEditing ? "bg-muted/30" : ""}
                    >
                      <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">
                        #{order.id.split("-")[0]}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {new Date(order.created_at).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground text-xs">
                          {order.customer_name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground text-xs">
                          {order.delivery_address || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground text-xs">
                          {order.phone_numbers?.join(", ") || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground text-xs">
                          {order.items?.map((item) => item.name).join(", ") ||
                            "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground text-xs text-center block">
                          {order.items?.reduce(
                            (total, item) => total + item.quantity,
                            0,
                          ) || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground text-xs text-center block">
                          {`₦${Number(order.total_amount).toLocaleString()}` ||
                            "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground text-xs">
                          {order.merchant || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-foreground text-xs italic">
                          {order.cc_comment || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <select
                            value={editForm?.delivery_status || "pending"}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      delivery_status: e.target.value as any,
                                    }
                                  : null,
                              )
                            }
                            className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
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
                              STATUS_STYLES[order.delivery_status || "pending"],
                            )}
                          >
                            {order.delivery_status || "pending"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <select
                            value={
                              (editForm as any)?.inventory_status || "Unpacked"
                            }
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      inventory_status: e.target.value as any,
                                    }
                                  : null,
                              )
                            }
                            className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="Unpacked">Unpacked</option>
                            <option value="Packed">Packed</option>
                            <option value="out of stock">out of stock</option>
                          </select>
                        ) : (
                          <span className="text-xs text-foreground whitespace-nowrap">
                            {(order as any).inventory_status || "Unpacked"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <select
                            value={(editForm as any)?.fom_assigned || ""}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      fom_assigned: e.target.value as any,
                                    }
                                  : null,
                              )
                            }
                            className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">Unassigned</option>
                            {fomUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.display_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-foreground whitespace-nowrap">
                            {fomUsers.find(
                              (u) => u.id === (order as any).fom_assigned,
                            )?.display_name ||
                              (order as any).fom_assigned ||
                              "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={(editForm as any)?.warehouse_comment || ""}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      warehouse_comment: e.target.value,
                                    }
                                  : null,
                              )
                            }
                            className="h-8 text-xs min-w-30"
                            placeholder="Add note..."
                          />
                        ) : (
                          <span className="text-xs text-foreground block max-w-37.5 truncate">
                            {(order as any).warehouse_comment || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">
                        {order.extracted_by?.split("-")[0] || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isEditing ? (
                            <>
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
                                onClick={() => setEditingId(null)}
                                disabled={isSaving}
                                title="Cancel"
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
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

// Delivery Status
// Inventory Status
// Assigned To
// Comment
