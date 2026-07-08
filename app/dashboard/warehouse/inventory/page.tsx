"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSupabaseRealtime } from "@/hooks/use-supabase-realtime";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Check, Download, Edit2, Loader2, X } from "lucide-react";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn, handleExport } from "@/lib/utils";
import { ExportButton } from "@/components/export-button";
import DataTable, { type DataTableColumn } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-purple-100 text-purple-900",
  shipped: "bg-blue-100 text-blue-900",
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
  const [ccUsers, setCcUsers] = useState<any[]>([]);
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
  const [merchantOptions, setMerchantOptions] = useState<string[]>([]);

  const startEditing = useCallback((order: Order) => {
    setEditingId(order.id);
    setEditForm({ ...order });
  }, []);

  const openCommentModal = useCallback(
    (orderId: string, currentVal: string) => {
      setActiveCommentOrderId(orderId);
      setTempComment(currentVal);
      setCommentModalOpen(true);
    },
    [],
  );

  const columns = useMemo<DataTableColumn[]>(
    () => [
      {
        key: "id",
        label: "Order ID",
        render: (row) => `#${String(row.id || "").split("-")[0]}`,
        getSearchableText: (row) => String(row.id || "").split("-")[0],
      },
      {
        key: "created_at",
        label: "Created At",
        render: (row) =>
          new Date(row.created_at as any).toLocaleString([], {
            dateStyle: "short",
            timeStyle: "short",
          }),
        getSearchableText: (row) =>
          new Date(row.created_at as any).toLocaleString([], {
            dateStyle: "short",
            timeStyle: "short",
          }),
      },
      {
        key: "customer_name",
        label: "Customer",
        longText: true,
        render: (row) => (row.customer_name as any) || "—",
        getSearchableText: (row) => (row.customer_name as any) || "",
      },
      {
        key: "delivery_address",
        label: "Delivery Address",
        longText: true,
        render: (row) => (row.delivery_address as any) || "—",
        getSearchableText: (row) => (row.delivery_address as any) || "",
      },
      {
        key: "phone_numbers",
        label: "Phone",
        render: (row) =>
          ((row.phone_numbers as string[]) || []).join(", ") || "—",
        getSearchableText: (row) =>
          ((row.phone_numbers as string[]) || []).join(", "),
      },
      {
        key: "items",
        label: "Items",
        longText: true,
        render: (row) =>
          ((row.items as any[]) || [])
            .map((item: any) => `${item.quantity}x ${item.name}`)
            .join(", "), // Display
        getSearchableText: (row) =>
          ((row.items as any[]) || []).map((item: any) => item.name).join(", "), // Searchable text
      },
      {
        key: "merchant",
        label: "Merchant",
        render: (row) => (row.merchant as any) || "—",
        getSearchableText: (row) => (row.merchant as any) || "",
      },
      {
        key: "inventory_status",
        label: "Inventory Del. Status",
        render: (row) =>
          editingId === String(row.id) ? (
            <select
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-[11px]"
              value={(editForm as any)?.inventory_status || ""}
              onChange={(e) =>
                setEditForm((prev) =>
                  prev ? { ...prev, inventory_status: e.target.value } : prev,
                )
              }
            >
              <option value="">Select status</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="shelved">Shelved</option>
              <option value="returned">Returned</option>
            </select>
          ) : (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase whitespace-nowrap",
                STATUS_STYLES[(row.inventory_status as any) || "pending"],
              )}
            >
              {(row.inventory_status as any) || "pending"}
            </span>
          ),
        getSearchableText: (row) => (row.inventory_status as any) || "pending",
      },
      {
        key: "warehouse_status",
        label: "Warehouse Status",
        render: (row) => (row as any).warehouse_status || "unpacked",
        getSearchableText: (row) => (row as any).warehouse_status || "unpacked",
      },
      {
        key: "fom_assigned",
        label: "FOM Assigned",
        render: (row) =>
          fomUsers.find((user) => user.id === (row as any).fom_assigned)
            ?.display_name || "—",
        getSearchableText: (row) =>
          fomUsers.find((user) => user.id === (row as any).fom_assigned)
            ?.display_name || "",
      },
      {
        key: "warehouse_comment",
        label: "Warehouse Comment",
        longText: true,
        render: (row) =>
          editingId === String(row.id) ? (
            <Input
              className="h-8 text-xs cursor-pointer"
              readOnly
              onClick={() =>
                openCommentModal(
                  String(row.id),
                  (editForm as any)?.warehouse_comment || "",
                )
              }
              value={(editForm as any)?.warehouse_comment || "—"}
            />
          ) : (
            (row as any).warehouse_comment || "—"
          ),
        getSearchableText: (row) => (row as any).warehouse_comment || "",
      },
    ],
    [editingId, editForm, fomUsers, openCommentModal],
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        { data: ordersData, error: fetchError },
        { data: merchantsData },
        { data: fomUserData },
        { data: ccUserData },
      ] = await Promise.all([
        supabase!
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase!
          .from("merchants")
          .select("name")
          .eq("is_active", true)
          .order("name"),
        supabase!.from("users").select("id, display_name").eq("role", "fom"),
        supabase!
          .from("users")
          .select("id, display_name")
          .eq("role", "customer_service"),
      ]);

      if (fetchError) throw fetchError;

      if (merchantsData)
        setMerchantOptions(merchantsData.map((m: any) => m.name));
      if (fomUserData) setFomUsers(fomUserData);
      if (ccUserData) setCcUsers(ccUserData);
      setOrders((ordersData ?? []) as Order[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleSave = useCallback(async () => {
    if (!editForm) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase!
        .from("orders")
        .update({
          status: "warehouse",
          inventory_status: editForm.inventory_status?.toLowerCase(),
          warehouse_status: (editForm as any).warehouse_status?.toLowerCase(),
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
  }, [editForm]);

  useSupabaseRealtime([{ table: "orders", event: "*" }], fetchOrders, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const renderRowActions = useCallback(
    (row: any) => {
      const orderId = String(row.id);
      const isEditing = editingId === orderId;
      return (
        <div className="flex justify-end gap-1">
          {isEditing ? (
            <>
              <Button
                size="icon-sm"
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
                size="icon-sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setEditForm(null);
                }}
              >
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </>
          ) : (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => startEditing(row as unknown as Order)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
    [editingId, handleSave, isSaving, startEditing],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Inventory Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Track stock levels and manage items across orders.
          </p>{" "}
          <div className="flex flex-wrap gap-2 mt-4">
            <ExportButton 
              disabled={loading || orders.length === 0} 
              onExport={async (start, end, type) => await handleExport(fomUsers, ccUsers, type, start, end)} 
            />
          </div>
        </div>
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
          <DataTable
            headers={columns}
            rows={filteredActionableOrders as any}
            merchantOptions={merchantOptions}
            filterMerchant={filterMerchant}
            onFilterMerchantChange={setFilterMerchant}
            showActions
            renderRowActions={renderRowActions}
          />
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
