"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Check, X, Store, Package, Archive } from "lucide-react";

export default function MerchantApprovalsPage() {
  const role = typeof window !== "undefined" ? localStorage.getItem("merchant_role") : null;
  
  const [loading, setLoading] = useState(true);
  const [pendingMerchants, setPendingMerchants] = useState<any[]>([]);
  const [pendingProducts, setPendingProducts] = useState<any[]>([]);
  const [pendingStock, setPendingStock] = useState<any[]>([]);

  const fetchPendingItems = useCallback(async () => {
    setLoading(true);
    try {
      const [merchantsRes, productsRes, stockRes] = await Promise.all([
        supabase!.from("merchants").select("*").eq("approval_status", "pending"),
        supabase!.from("products").select("*, merchants(name)").eq("approval_status", "pending"),
        supabase!.from("stock_entries").select("*, products(name), merchants(name)").eq("status", "pending"),
      ]);

      if (merchantsRes.data) setPendingMerchants(merchantsRes.data);
      if (productsRes.data) setPendingProducts(productsRes.data);
      if (stockRes.data) setPendingStock(stockRes.data);
    } catch (err) {
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingItems();
  }, [fetchPendingItems]);

  const canApprove = (item: any) => {
    if (role === "admin" && !item.admin_approved) return true;
    if (role === "warehouse" && !item.warehouse_approved) return true;
    return false;
  };

  const handleApprove = async (table: string, item: any) => {
    const isNowAdminApproved = role === "admin" || item.admin_approved;
    const isNowWarehouseApproved = role === "warehouse" || item.warehouse_approved;
    const isFullyApproved = isNowAdminApproved && isNowWarehouseApproved;

    const updates: any = {
      admin_approved: isNowAdminApproved,
      warehouse_approved: isNowWarehouseApproved,
    };

    if (table === "stock_entries") {
      if (isFullyApproved) {
        updates.status = "approved";
        updates.approved_by = "system"; // Normally this would be a user ID, but we don't have auth IDs here
        updates.approved_at = new Date().toISOString();
      }
    } else {
      if (isFullyApproved) {
        updates.approval_status = "approved";
      }
    }

    try {
      const { error } = await supabase!.from(table).update(updates).eq("id", item.id);
      if (error) throw error;
      toast.success(isFullyApproved ? "Item fully approved and went live!" : "Your approval was recorded.");
      fetchPendingItems();
    } catch (err) {
      toast.error("Failed to approve item");
    }
  };

  const handleReject = async (table: string, itemId: string) => {
    const updates: any = {};
    if (table === "stock_entries") {
      updates.status = "rejected";
    } else {
      updates.approval_status = "rejected";
    }

    try {
      const { error } = await supabase!.from(table).update(updates).eq("id", itemId);
      if (error) throw error;
      toast.success("Item rejected");
      fetchPendingItems();
    } catch (err) {
      toast.error("Failed to reject item");
    }
  };

  const ApprovalBadge = ({ admin, warehouse }: { admin: boolean; warehouse: boolean }) => (
    <div className="flex gap-2 text-[10px] font-semibold uppercase">
      <span className={`px-2 py-0.5 rounded-full ${admin ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
        Admin: {admin ? "Yes" : "No"}
      </span>
      <span className={`px-2 py-0.5 rounded-full ${warehouse ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
        WH: {warehouse ? "Yes" : "No"}
      </span>
    </div>
  );

  if (role !== "admin" && role !== "warehouse") {
    return (
      <div className="p-12 text-center text-slate-500">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-500 mt-2">
          Review and approve changes made by Guests, or co-approve actions from other managers.
        </p>
      </div>

      {loading ? (
        <Card className="p-12 text-center border-0 shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-slate-500">Loading pending items...</p>
        </Card>
      ) : (
        <>
          {/* Pending Merchants */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Store className="h-5 w-5 text-slate-500" /> Pending Merchants ({pendingMerchants.length})
            </h2>
            {pendingMerchants.length === 0 ? (
              <p className="text-sm text-slate-500">No pending merchants.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pendingMerchants.map((merchant) => (
                  <Card key={merchant.id} className="p-4 flex items-center justify-between border-0 shadow-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{merchant.name}</p>
                      <p className="text-xs text-slate-400 mt-1">Submitted by: <span className="capitalize">{merchant.submitted_by_role}</span></p>
                      <div className="mt-2">
                        <ApprovalBadge admin={merchant.admin_approved} warehouse={merchant.warehouse_approved} />
                      </div>
                    </div>
                    {canApprove(merchant) && (
                      <div className="flex gap-2">
                        <Button size="icon-sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleApprove("merchants", merchant)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon-sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleReject("merchants", merchant.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Pending Products */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Package className="h-5 w-5 text-slate-500" /> Pending Products ({pendingProducts.length})
            </h2>
            {pendingProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No pending products.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingProducts.map((product) => (
                  <Card key={product.id} className="p-4 flex flex-col justify-between border-0 shadow-sm">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-900">{product.name}</p>
                          <p className="text-xs text-primary font-mono font-medium">₦{Number(product.price).toLocaleString()}</p>
                        </div>
                        {canApprove(product) && (
                          <div className="flex gap-1">
                            <Button size="icon-sm" variant="ghost" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleApprove("products", product)}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon-sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleReject("products", product.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Merchant: {product.merchants?.name}</p>
                      <p className="text-xs text-slate-400">Submitted by: <span className="capitalize">{product.submitted_by_role}</span></p>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <ApprovalBadge admin={product.admin_approved} warehouse={product.warehouse_approved} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Pending Stock */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Archive className="h-5 w-5 text-slate-500" /> Pending Stock Additions ({pendingStock.length})
            </h2>
            {pendingStock.length === 0 ? (
              <p className="text-sm text-slate-500">No pending stock entries.</p>
            ) : (
              <div className="space-y-3">
                {pendingStock.map((entry) => (
                  <Card key={entry.id} className="p-4 flex items-center justify-between border-0 shadow-sm">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Merchant</p>
                        <p className="text-sm font-semibold text-slate-900">{entry.merchants?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Product</p>
                        <p className="text-sm font-semibold text-slate-900">{entry.products?.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Quantity</p>
                        <p className="text-sm font-bold text-primary">+{entry.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Submitted By</p>
                        <p className="text-sm font-semibold text-slate-700 capitalize">{entry.submitted_by_role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <ApprovalBadge admin={entry.admin_approved} warehouse={entry.warehouse_approved} />
                      {canApprove(entry) && (
                        <div className="flex gap-2 pl-4 border-l">
                          <Button size="icon-sm" variant="outline" className="text-emerald-600 hover:bg-emerald-50" onClick={() => handleApprove("stock_entries", entry)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon-sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleReject("stock_entries", entry.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
