"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Order, OrderStatus } from "@/lib/types";
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
import { Loader2, Package, Search, Edit2, Check, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Order | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [ccUsers, setCcUsers] = useState<any[]>([]);
  const [merchantOptions, setMerchantOptions] = useState<string[]>([]);
  const [modalField, setModalField] = useState<
    | "customer_name"
    | "delivery_address"
    | "phone_numbers"
    | "merchant"
    | "cc_comment"
    | "item_name"
    | null
  >(null);
  const [modalValue, setModalValue] = useState("");
  const [modalItemIndex, setModalItemIndex] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load CC users
      const { data: ccUserData } = await supabase!
        .from("users")
        .select("id, display_name")
        .eq("role", "customer_service");
      if (ccUserData) setCcUsers(ccUserData);

      const [{ data: merchantData }, { data, error: fetchError }] =
        await Promise.all([
          supabase!
            .from("merchants")
            .select("name")
            .eq("is_active", true)
            .order("name"),
          supabase!
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (merchantData) {
        setMerchantOptions(
          merchantData.map((row: any) => row.name).filter(Boolean),
        );
      }

      if (fetchError) {
        throw fetchError;
      }

      setOrders((data ?? []) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useSupabaseRealtime([{ table: "orders", event: "*" }], fetchOrders, []);

  const filteredOrders = useMemo(() => orders, [orders]);

  const startEditing = (order: Order) => {
    setEditingId(order.id);
    setEditForm({ ...order });
  };

  const openModal = (
    field: typeof modalField & string,
    value: string,
    index: number | null = null,
  ) => {
    setModalField(field as any);
    setModalValue(value);
    setModalItemIndex(index);
    setModalOpen(true);
  };

  const handleSaveModalValue = () => {
    if (modalField && editForm) {
      setEditForm((prev) => {
        if (!prev) return null;
        if (modalField === "phone_numbers") {
          return {
            ...prev,
            phone_numbers: modalValue
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          };
        }
        if (modalField === "item_name" && modalItemIndex !== null) {
          const newItems = [...(prev.items || [])];
          newItems[modalItemIndex] = {
            ...newItems[modalItemIndex],
            name: modalValue,
          };
          return { ...prev, items: newItems };
        }
        return { ...prev, [modalField]: modalValue };
      });
    }
    setModalOpen(false);
  };

  const handleSave = async () => {
    if (!editForm || !supabase) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase!
        .from("orders")
        .update({
          customer_name: editForm.customer_name,
          delivery_address: editForm.delivery_address,
          phone_numbers: editForm.phone_numbers,
          merchant: editForm.merchant,
          total_amount: editForm.total_amount,
          items: editForm.items,
          cc_comment: editForm.cc_comment,
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground mt-2">
          Review customer orders and track their workflow across the system.
        </p>
      </div>

      {loading ? (
        <Card className="p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading orders...
          </p>
        </Card>
      ) : error ? (
        <Card className="p-6 bg-destructive/10 border-destructive/30">
          <p className="text-destructive font-medium">Error loading orders</p>
          <p className="text-sm text-destructive/80 mt-2">{error}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
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
                <TableHead className="font-semibold">Comments</TableHead>
                <TableHead className="font-semibold">Entered By</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No orders match the selected status.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
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
                        {isEditing ? (
                          <Input
                            value={editForm?.customer_name || ""}
                            readOnly
                            className="h-8 text-sm cursor-pointer"
                            onClick={() =>
                              openModal(
                                "customer_name",
                                editForm?.customer_name || "",
                              )
                            }
                          />
                        ) : (
                          <span className="font-medium text-foreground">
                            {order.customer_name || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm?.delivery_address || ""}
                            readOnly
                            className="h-8 text-sm cursor-pointer"
                            onClick={() =>
                              openModal(
                                "delivery_address",
                                editForm?.delivery_address || "",
                              )
                            }
                          />
                        ) : (
                          <span className="text-foreground">
                            {order.delivery_address || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm?.phone_numbers?.join(", ") || ""}
                            readOnly
                            className="h-8 text-sm cursor-pointer"
                            onClick={() =>
                              openModal(
                                "phone_numbers",
                                editForm?.phone_numbers?.join(", ") || "",
                              )
                            }
                          />
                        ) : (
                          <span className="text-foreground">
                            {order.phone_numbers?.join(", ") || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            {editForm?.items?.map((item, idx) => (
                              <Input
                                key={idx}
                                value={item.name}
                                readOnly
                                className="h-8 text-sm min-w-37.5 cursor-pointer"
                                onClick={() =>
                                  openModal("item_name", item.name, idx)
                                }
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-foreground">
                            {order.items?.map((item) => item.name).join(", ") ||
                              "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            {editForm?.items?.map((item, idx) => (
                              <Input
                                key={idx}
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  setEditForm((prev) => {
                                    if (!prev) return null;
                                    const newItems = [...(prev.items || [])];
                                    newItems[idx] = {
                                      ...newItems[idx],
                                      quantity: Number(e.target.value) || 0,
                                    };
                                    return { ...prev, items: newItems };
                                  })
                                }
                                className="h-8 text-sm w-20"
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-foreground">
                            {order.items?.reduce(
                              (total, item) => total + item.quantity,
                              0,
                            ) || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editForm?.total_amount || 0}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      total_amount: Number(e.target.value),
                                    }
                                  : null,
                              )
                            }
                            className="h-8 text-sm w-24"
                          />
                        ) : (
                          <span className="text-foreground">
                            {`₦${Number(order.total_amount).toLocaleString()}` ||
                              "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm?.merchant || ""}
                            readOnly
                            className="h-8 text-sm cursor-pointer"
                            onClick={() =>
                              openModal("merchant", editForm?.merchant || "")
                            }
                          />
                        ) : (
                          <span className="text-foreground">
                            {order.merchant || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editForm?.cc_comment || ""}
                            readOnly
                            className="h-8 text-sm cursor-pointer"
                            onClick={() =>
                              openModal(
                                "cc_comment",
                                editForm?.cc_comment || "",
                              )
                            }
                          />
                        ) : (
                          <span className="text-foreground">
                            {order.cc_comment || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">
                        {ccUsers.find((u) => u.id === order.extracted_by)
                          ?.display_name || "—"}
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
        </Card>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-131.25">
          <DialogHeader>
            <DialogTitle className="capitalize">
              Edit {modalField?.replace("_", " ")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {modalField === "merchant" ? (
              <select
                className="h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
              >
                <option value="">Select Merchant</option>
                {merchantOptions.map((merchant) => (
                  <option key={merchant} value={merchant}>
                    {merchant}
                  </option>
                ))}
              </select>
            ) : (
              <Textarea
                placeholder={`Enter ${modalField?.replace("_", " ")}...`}
                className="min-h-37.5"
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveModalValue}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
