"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OrderSearchFilter from "@/components/order-search-filter";
import { Loader2, Download, Trash2, Edit2, Check, X } from "lucide-react";
import { Order } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const formatCurrency = (value: number) =>
  `₦${Number(value || 0).toLocaleString()}`;

const buildCsv = (orders: Order[], fomUsers: any[] = []) => {
  const headers = [
    "Order ID",
    "Created At",
    "Customer Name",
    "Merchant",
    "Items",
    "Total Amount",
    "Warehouse Delivery Status",
    "Fom Delivery Status",
    "Inventory Status",
    "FOM Assigned",
    "Rider Name",
    "Rider Price",
    "Payment Method",
    "Payment Confirmed",
    "Payment by Merchant",
    "Bank",
    "Delivery Address",
    "Phone Numbers",
  ];

  const rows = orders.map((order) => {
    const fomUser = fomUsers.find((u) => u.id === (order as any).fom_assigned);
    return [
      `${order.id.split("-")[0]}`,
      new Date(order.created_at).toLocaleString(),
      order.customer_name || "",
      order.merchant || "",
      order.items?.map((i) => `${i.quantity}x ${i.name}`).join("; ") || "",
      Number(order.total_amount || 0).toFixed(2),
      order.warehouse_delivery_status || "",
      order.fom_delivery_status || "",
      (order as any).inventory_status || "",
      fomUser?.display_name || "",
      (order as any).rider_name || "",
      Number((order as any).price_with_rider || 0).toFixed(2),
      (order as any).payment_method || "",
      (order as any).payment_confirmed ? "Yes" : "No",
      Number(order.payment_by_merchant || 0).toFixed(2),
      (order as any).bank || "",
      order.delivery_address || "",
      Array.isArray(order.phone_numbers) ? order.phone_numbers.join(", ") : "",
    ];
  });

  const escapeValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeValue(String(value))).join(","))
    .join("\n");
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Order | null>(null);
  const [fomUsers, setFomUsers] = useState<any[]>([]);
  const [merchantOptions, setMerchantOptions] = useState<string[]>([]);
  const [riderOptions, setRiderOptions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMerchant, setFilterMerchant] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());

  // Modal states for long text fields
  const [modalOpen, setModalOpen] = useState(false);
  const [modalField, setModalField] = useState<string | null>(null);
  const [modalValue, setModalValue] = useState("");
  const [modalOrderId, setModalOrderId] = useState<string | null>(null);
  const [modalItemIndex, setModalItemIndex] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Fetch FOM users for the assignment dropdown
    const { data: userData } = await supabase!
      .from("users")
      .select("id, display_name")
      .eq("role", "fom");
    if (userData) setFomUsers(userData);

    const [{ data: merchantData }, { data: riderData }] = await Promise.all([
      supabase!
        .from("merchants")
        .select("name")
        .eq("is_active", true)
        .order("name"),
      supabase!
        .from("riders")
        .select("name")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (merchantData) {
      setMerchantOptions(
        merchantData.map((row: any) => row.name).filter(Boolean),
      );
    }
    if (riderData) {
      setRiderOptions(riderData.map((row: any) => row.name).filter(Boolean));
    }

    try {
      let query = supabase!
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (startDate) {
        query = query.gte("created_at", `${startDate}T00:00:00Z`);
      }
      if (endDate) {
        query = query.lte("created_at", `${endDate}T23:59:59Z`);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setOrders((data ?? []) as Order[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }, [endDate, startDate]);

  useSupabaseRealtime([{ table: "orders", event: "*" }], fetchOrders, [
    startDate,
    endDate,
  ]);

  const startEditing = (order: Order) => {
    setEditingId(order.id);
    setEditForm({ ...order });
    setEditedFields(new Set());
  };

  const openModal = (
    field: string,
    value: string,
    orderId: string,
    index: number | null = null,
  ) => {
    setModalField(field);
    setModalValue(value);
    setModalOrderId(orderId);
    setModalItemIndex(index);
    setModalOpen(true);
  };

  const handleSaveModalValue = () => {
    if (modalField && editForm && modalOrderId && modalOrderId === editingId) {
      const newEditedFields = new Set(editedFields);
      newEditedFields.add(modalField);
      setEditedFields(newEditedFields);

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
    if (!editForm) return;
    setActionLoading(editForm.id);

    try {
      const { error: updateError } = await supabase!
        .from("orders")
        .update({
          customer_name: editForm.customer_name,
          delivery_address: editForm.delivery_address,
          phone_numbers: editForm.phone_numbers,
          merchant: editForm.merchant,
          items: editForm.items,
          total_amount: editForm.total_amount,
          warehouse_delivery_status:
            editForm.warehouse_delivery_status?.toLowerCase(),
          fom_delivery_status: editForm.fom_delivery_status?.toLowerCase(),
          inventory_status: (editForm as any).inventory_status?.toLowerCase(),
          fom_assigned: (editForm as any).fom_assigned,
          warehouse_comment: (editForm as any).warehouse_comment,
          rider_name: (editForm as any).rider_name,
          price_with_rider: (editForm as any).price_with_rider,
          payment_method: (editForm as any).payment_method.to,
          payment_confirmed:
            (editForm as any).payment_confirmed === "true" ||
            (editForm as any).payment_confirmed === true,
          bank: (editForm as any).bank,
          cc_comment: (editForm as any).cc_comment,
          fom_comment: (editForm as any).fom_comment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editForm.id);

      if (updateError) throw updateError;
      toast.success("Order updated successfully");
      setEditingId(null);
      setEditForm(null);
      fetchOrders();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update order",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this order permanently? This action cannot be undone.",
    );
    if (!confirmed) return;

    setActionLoading(id);
    setError(null);

    try {
      const { error: deleteError } = await supabase!
        .from("orders")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete order.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    const csv = buildCsv(orders, fomUsers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rachamhub-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  const summary = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(
      (order) => order.fom_delivery_status === "delivered",
    ).length;
    const failed = orders.filter(
      (order) =>
        order.fom_delivery_status === "failed" ||
        order.fom_delivery_status === "cancelled",
    ).length;
    const revenue = orders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0,
    );
    const owed = orders.reduce(
      (sum, order) => sum + Number(order.payment_by_merchant || 0),
      0,
    );
    const fees = orders.reduce(
      (sum, order) =>
        sum +
        Number(order.total_amount || 0) -
        Number(order.payment_by_merchant || 0),
      0,
    );
    return {
      total,
      delivered,
      failed,
      revenue,
      owed,
      fees,
      successRate: total === 0 ? 0 : Math.round((delivered / total) * 100),
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Orders</h1>
          <p className="text-muted-foreground mt-2">
            View every order across all departments and manage system-level
            records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleExport}
            disabled={loading || orders.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={loading || orders.length === 0}
          >
            <Download className="mr-2 h-4 w-4" /> Export Spreadsheet
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total orders</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.total}
          </p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Delivery success</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.successRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Failed / cancelled</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {summary.failed}
          </p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total revenue</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(summary.revenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Fees collected</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(summary.fees)}
          </p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Amount owed to merchants
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(summary.owed)}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>From</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <Label>To</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-end justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear dates
            </Button>
            <Button onClick={fetchOrders}>Refresh</Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading orders...
          </p>
        </Card>
      ) : error ? (
        <Card className="p-6 bg-destructive/10 text-destructive">{error}</Card>
      ) : (
        <Card className="overflow-x-auto">
          <OrderSearchFilter
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            merchantOptions={merchantOptions}
            filterMerchant={filterMerchant}
            onFilterMerchantChange={setFilterMerchant}
          />
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Warehouse Delivery Status</TableHead>
                <TableHead>FOM Delivery Status</TableHead>
                <TableHead>Inventory Status</TableHead>
                <TableHead>FOM</TableHead>
                <TableHead>Rider</TableHead>
                <TableHead>Rider Fee</TableHead>
                <TableHead>Pay Method</TableHead>
                <TableHead>Confirmed</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={16}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No orders found for the selected date range.
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
                      <TableCell className="font-mono text-[10px] uppercase">
                        #{order.id.split("-")[0]}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[10px]">
                        {new Date(order.created_at).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>

                      {/* Editable Fields */}
                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-7 text-xs w-28"
                              value={editForm?.customer_name || ""}
                              onChange={(e) => {
                                const newEditedFields = new Set(editedFields);
                                newEditedFields.add("customer_name");
                                setEditedFields(newEditedFields);
                                setEditForm((prev) =>
                                  prev
                                    ? { ...prev, customer_name: e.target.value }
                                    : null,
                                );
                              }}
                            />
                            {editedFields.has("customer_name") && (
                              <span className="text-[8px] px-1 py-0.5 rounded-full bg-gray-400 text-gray-700 whitespace-nowrap">
                                edited
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs">{order.customer_name}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Input
                          className="h-7 text-xs w-24 cursor-pointer"
                          readOnly
                          value={
                            isEditing
                              ? editForm?.delivery_address!
                              : order.delivery_address || ""
                          }
                          onClick={() =>
                            openModal(
                              "delivery_address",
                              isEditing
                                ? editForm?.delivery_address || ""
                                : order.delivery_address || "",
                              order.id,
                            )
                          }
                        />
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <select
                              className="h-7 w-24 rounded-md border border-input bg-background px-1 text-xs"
                              value={editForm?.merchant || ""}
                              onChange={(e) => {
                                const newEditedFields = new Set(editedFields);
                                newEditedFields.add("merchant");
                                setEditedFields(newEditedFields);
                                setEditForm((prev) =>
                                  prev
                                    ? { ...prev, merchant: e.target.value }
                                    : null,
                                );
                              }}
                            >
                              <option value="">Select Merchant</option>
                              {merchantOptions.map((merchant) => (
                                <option key={merchant} value={merchant}>
                                  {merchant}
                                </option>
                              ))}
                            </select>
                            {editedFields.has("merchant") && (
                              <span className="text-[8px] px-1 py-0.5 rounded-full bg-gray-400 text-gray-700 whitespace-nowrap">
                                edited
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs">{order.merchant}</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-[10px] whitespace-nowrap">
                          {(isEditing ? editForm! : order).items
                            ?.map((i) => `${i.quantity}x ${i.name}`)
                            .join(", ")}
                        </span>
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              className="h-7 text-xs w-20"
                              value={editForm?.total_amount || 0}
                              onChange={(e) => {
                                const newEditedFields = new Set(editedFields);
                                newEditedFields.add("total_amount");
                                setEditedFields(newEditedFields);
                                setEditForm((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        total_amount: Number(e.target.value),
                                      }
                                    : null,
                                );
                              }}
                            />
                            {editedFields.has("total_amount") && (
                              <span className="text-[8px] px-1 py-0.5 rounded-full bg-gray-400 text-gray-700 whitespace-nowrap">
                                edited
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs">
                            {formatCurrency(Number(order.total_amount))}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <select
                            className="h-7 w-24 rounded-md border border-input bg-background px-1 text-[10px]"
                            value={editForm?.warehouse_delivery_status || ""}
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
                          >
                            <option value="pending">Pending</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="failed">Failed</option>
                            <option value="returned">Returned</option>
                          </select>
                        ) : (
                          <span className="text-[10px] uppercase">
                            {order.warehouse_delivery_status}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <select
                            className="h-7 w-24 rounded-md border border-input bg-background px-1 text-[10px]"
                            value={editForm?.fom_delivery_status || ""}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      fom_delivery_status: e.target
                                        .value as any,
                                    }
                                  : null,
                              )
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="failed">Failed</option>
                            <option value="returned">Returned</option>
                          </select>
                        ) : (
                          <span className="text-[10px] uppercase">
                            {order.fom_delivery_status}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <select
                            className="h-7 w-24 rounded-md border border-input bg-background px-1 text-[10px]"
                            value={(editForm as any)?.inventory_status || ""}
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
                          >
                            <option value="unpacked">Unpacked</option>
                            <option value="packed">Packed</option>
                            <option value="out of stock">Out of Stock</option>
                          </select>
                        ) : (
                          <span className="text-[10px] uppercase">
                            {(order as any).inventory_status}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <select
                            className="h-7 w-24 rounded-md border border-input bg-background px-1 text-[10px]"
                            value={(editForm as any)?.fom_assigned || ""}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, fom_assigned: e.target.value }
                                  : null,
                              )
                            }
                          >
                            <option value="">Unassigned</option>
                            {fomUsers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.display_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] whitespace-nowrap">
                            {fomUsers.find(
                              (u) => u.id === (order as any).fom_assigned,
                            )?.display_name || "—"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <select
                            className="h-7 w-24 rounded-md border border-input bg-background px-1 text-xs"
                            value={(editForm as any)?.rider_name || ""}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, rider_name: e.target.value }
                                  : null,
                              )
                            }
                          >
                            <option value="">Select Rider</option>
                            {riderOptions.map((rider) => (
                              <option key={rider} value={rider}>
                                {rider}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs">
                            {(order as any).rider_name || "—"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            className="h-7 text-xs w-20"
                            value={(editForm as any)?.price_with_rider || 0}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      price_with_rider: Number(e.target.value),
                                    }
                                  : null,
                              )
                            }
                          />
                        ) : (
                          <span className="text-xs">
                            {formatCurrency(
                              Number((order as any).price_with_rider),
                            )}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <select
                            className="h-7 w-24 rounded-md border border-input bg-background px-1 text-[10px]"
                            value={(editForm as any)?.payment_method || ""}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, payment_method: e.target.value }
                                  : null,
                              )
                            }
                          >
                            <option value="">N/A</option>
                            <option value="Cash">Cash</option>
                            <option value="Transfer">Transfer</option>
                            <option value="PBD">PBD</option>
                          </select>
                        ) : (
                          <span className="text-xs">
                            {(order as any).payment_method || "—"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <select
                            className="h-7 w-20 rounded-md border border-input bg-background px-1 text-[10px]"
                            value={String((editForm as any)?.payment_confirmed)}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      payment_confirmed:
                                        e.target.value === "true",
                                    }
                                  : null,
                              )
                            }
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        ) : (
                          <span className="text-xs">
                            {order.payment_confirmed ? "Yes" : "No"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <select
                            className="h-7 w-24 rounded-md border border-input bg-background px-1 text-[10px]"
                            value={(editForm as any)?.bank || ""}
                            onChange={(e) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, bank: e.target.value } : null,
                              )
                            }
                          >
                            <option value="">Select Bank</option>
                            <option value="UBA">UBA</option>
                            <option value="Moniepoint">Moniepoint</option>
                          </select>
                        ) : (
                          <span className="text-xs">
                            {(order as any).bank || "—"}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[9px] px-1"
                            onClick={() =>
                              openModal(
                                "cc_comment",
                                (isEditing ? editForm! : order).cc_comment ||
                                  "",
                                order.id,
                              )
                            }
                          >
                            CC Note
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[9px] px-1"
                            onClick={() =>
                              openModal(
                                "warehouse_comment",
                                (isEditing ? editForm! : order)
                                  .warehouse_comment || "",
                                order.id,
                              )
                            }
                          >
                            WH Note
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[9px] px-1"
                            onClick={() =>
                              openModal(
                                "fom_comment",
                                (isEditing ? editForm! : order).fom_comment ||
                                  "",
                                order.id,
                              )
                            }
                          >
                            FOM Note
                          </Button>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={handleSave}
                                disabled={actionLoading === order.id}
                              >
                                {actionLoading === order.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                )}
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-3 w-3 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => startEditing(order)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="destructive"
                                onClick={() => handleDeleteOrder(order.id)}
                                disabled={actionLoading === order.id}
                                title="Delete order"
                              >
                                {actionLoading === order.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </>
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

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setModalOrderId(null);
        }}
      >
        <DialogContent className="sm:max-w-125">
          <DialogDescription className="hidden">Input Dialog</DialogDescription>
          <DialogHeader>
            <DialogTitle className="capitalize">
              Edit {modalField?.replace(/_/g, " ")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              className="min-h-37.5"
              value={modalValue}
              onChange={(e) => setModalValue(e.target.value)}
              readOnly={modalOrderId !== editingId}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            {editingId && modalOrderId === editingId && (
              <Button onClick={handleSaveModalValue}>Save Changes</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
