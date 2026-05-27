"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

const RIDERS = ["Rider 1", "Rider 2", "Rider 3"];
const LANDMARKS = [
  "Ikeja",
  "Surulere",
  "Lekki",
  "Ajah",
  "Ikorodu",
  "Mowe",
  "Ibafo",
  "Abeokuta",
];
const PAYMENT_METHODS = ["Cash", "Transfer", "PBD"];
const DELIVERY_STATUSES = ["Delivered", "Returned", "Failed", "Cancelled"];

export default function FOMDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowInputs, setRowInputs] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeCommentOrderId, setActiveCommentOrderId] = useState<
    string | null
  >(null);
  const [tempComment, setTempComment] = useState("");

  useEffect(() => {
    if (!user?.uid) return;

    const fetchFomOrders = async () => {
      setLoading(true);
      const { data } = await supabase!
        .from("orders")
        .select("*")
        .eq("fom_assigned", user.uid)
        .order("created_at", { ascending: false });
      setOrders((data ?? []) as Order[]);
      setLoading(false);
    };

    fetchFomOrders();

    const channel = supabase!
      .channel("fom-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        fetchFomOrders,
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [user?.uid]);

  const updateRowInput = (orderId: string, field: string, value: any) => {
    setRowInputs((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [field]: value,
      },
    }));
  };

  const openCommentModal = (orderId: string, currentVal: string) => {
    setActiveCommentOrderId(orderId);
    setTempComment(currentVal);
    setCommentModalOpen(true);
  };

  const handleSaveComment = () => {
    if (activeCommentOrderId) {
      updateRowInput(activeCommentOrderId, "fom_comment", tempComment);
    }
    setCommentModalOpen(false);
  };

  const handleFomSubmit = async (order: Order) => {
    const inputs = rowInputs[order.id] || {};
    if (
      !inputs.rider_name ||
      !inputs.delivery_status ||
      !inputs.payment_method
    ) {
      toast.error("Required fields missing", {
        description: "Rider, Delivery Status, and Payment Method are required.",
      });
      return;
    }

    setIsSubmitting(order.id);
    const riderPrice = Number(inputs.price_with_rider) || 0;
    const paymentByMerchant = Number(order.total_amount) - riderPrice;

    try {
      const { error } = await supabase!
        .from("orders")
        .update({
          status: "fom",
          rider_name: inputs.rider_name,
          price_with_rider: riderPrice,
          landmark: inputs.landmark,
          payment_by_merchant: paymentByMerchant,
          delivery_status: inputs.delivery_status.toLowerCase(),
          payment_method: inputs.payment_method,
          fom_comment: inputs.fom_comment,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (error) throw error;
      toast.success("Order submitted successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit order",
      );
    } finally {
      setIsSubmitting(null);
    }
  };

  const fomLevel = user?.role.toUpperCase() || "FOM";
  const assignedOrders = orders.length;
  const inProgress = orders.filter(
    (order) => order.delivery_status === "processing",
  ).length;
  const readyForDelivery = orders.filter(
    (order) => order.delivery_status === "shipped",
  ).length;
  const completedToday = orders.filter(
    (order) =>
      order.delivery_status === "delivered" &&
      new Date(order.updated_at).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {fomLevel} Fulfillment Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor and manage order fulfillment operations.
        </p>
      </div>

      {loading ? (
        <Card className="p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading fulfillment metrics...
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Assigned Orders
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {assignedOrders}
                </p>
              </div>
              <Package className="h-6 w-6 text-primary" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {inProgress}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Pending Delivery
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {readyForDelivery}
                </p>
              </div>
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Completed Today
                </p>
                <p className="text-2xl font-bold text-foreground mt-2">
                  {completedToday}
                </p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          New Orders Queue
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-37.5">Customer / Address</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Amount (₦)</TableHead>
                <TableHead>Rider Name</TableHead>
                <TableHead>Rider Price (₦)</TableHead>
                <TableHead>Landmark</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.filter((o) => o.status === "warehouse").length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No new orders assigned.
                  </TableCell>
                </TableRow>
              ) : (
                orders
                  .filter((o) => o.status === "warehouse")
                  .map((order) => {
                    const inputs = rowInputs[order.id] || {};
                    const riderPrice = Number(inputs.price_with_rider) || 0;
                    const paymentByMerchant =
                      Number(order.total_amount) - riderPrice;

                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="text-xs font-semibold">
                            {order.customer_name}
                          </div>
                          <div className="text-[10px] text-muted-foreground line-clamp-1">
                            {order.delivery_address}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {order.items
                            ?.map((i) => `${i.quantity}x ${i.name}`)
                            .join(", ")}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            ₦{Number(order.total_amount).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-medium">
                            To Merchant: ₦{paymentByMerchant.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-8 w-30 rounded-md border border-input bg-background px-2 text-[11px]"
                            value={inputs.rider_name || ""}
                            onChange={(e) =>
                              updateRowInput(
                                order.id,
                                "rider_name",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Rider</option>
                            {RIDERS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 w-20 text-[11px]"
                            type="number"
                            placeholder="0.00"
                            value={inputs.price_with_rider || ""}
                            onChange={(e) =>
                              updateRowInput(
                                order.id,
                                "price_with_rider",
                                e.target.value,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-8 w-30 rounded-md border border-input bg-background px-2 text-[11px]"
                            value={inputs.landmark || ""}
                            onChange={(e) =>
                              updateRowInput(
                                order.id,
                                "landmark",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Select Landmark</option>
                            {LANDMARKS.map((l) => (
                              <option key={l} value={l}>
                                {l}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[11px]"
                            value={inputs.payment_method || ""}
                            onChange={(e) =>
                              updateRowInput(
                                order.id,
                                "payment_method",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Method</option>
                            {PAYMENT_METHODS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <select
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-[11px]"
                            value={inputs.delivery_status || ""}
                            onChange={(e) =>
                              updateRowInput(
                                order.id,
                                "delivery_status",
                                e.target.value,
                              )
                            }
                          >
                            <option value="">Pending</option>
                            {DELIVERY_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 w-24 text-[11px] cursor-pointer"
                            placeholder="Note..."
                            value={inputs.fom_comment || ""}
                            readOnly
                            onClick={() =>
                              openCommentModal(
                                order.id,
                                inputs.fom_comment || "",
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="h-8 px-3"
                            onClick={() => handleFomSubmit(order)}
                            disabled={isSubmitting === order.id}
                          >
                            {isSubmitting === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            <span className="ml-1">Submit</span>
                          </Button>
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
            <DialogTitle>Add Order Comment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Enter detailed comment or delivery instructions..."
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
