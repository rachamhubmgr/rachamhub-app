"use client";

import { useEffect, useState } from "react";
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
import { Loader2, Plus, Edit2, Check, X } from "lucide-react";

type MerchantRow = {
  id: string;
  name: string;
  is_active: boolean;
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMerchant, setNewMerchant] = useState("");
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(
    null,
  );
  const [editingName, setEditingName] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMerchants = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase!
        .from("merchants")
        .select("*")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setMerchants((data ?? []) as MerchantRow[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load merchants.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
    const channel = supabase!
      .channel("admin-merchants")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "merchants" },
        fetchMerchants,
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, []);

  const onSaveMerchant = async () => {
    if (!newMerchant.trim()) return;
    setActionLoading("new");
    setError(null);

    try {
      const { error: insertError } = await supabase!.from("merchants").insert([
        {
          name: newMerchant.trim(),
          is_active: true,
        },
      ]);
      if (insertError) throw insertError;
      setNewMerchant("");
      await fetchMerchants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add merchant.");
    } finally {
      setActionLoading(null);
    }
  };

  const onUpdateMerchant = async (merchant: MerchantRow) => {
    if (!editingName.trim()) return;
    setActionLoading(merchant.id);
    setError(null);

    try {
      const { error: updateError } = await supabase!
        .from("merchants")
        .update({ name: editingName.trim() })
        .eq("id", merchant.id);
      if (updateError) throw updateError;
      setEditingMerchantId(null);
      setEditingName("");
      await fetchMerchants();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to rename merchant.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const onToggleActive = async (merchant: MerchantRow) => {
    setActionLoading(merchant.id);
    setError(null);

    try {
      const { error: updateError } = await supabase!
        .from("merchants")
        .update({ is_active: !merchant.is_active })
        .eq("id", merchant.id);
      if (updateError) throw updateError;
      await fetchMerchants();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update merchant status.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Merchant Management
            </h1>
            <p className="text-muted-foreground mt-2">
              Add, rename, or deactivate merchants used across the system.
            </p>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            value={newMerchant}
            onChange={(event) => setNewMerchant(event.target.value)}
            placeholder="Add a new merchant"
            className="w-full"
          />
          <div className="flex items-end gap-2">
            <Button onClick={onSaveMerchant} disabled={actionLoading === "new"}>
              <Plus className="mr-2 h-4 w-4" /> Add merchant
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card className="p-6 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading merchants...
          </p>
        </Card>
      ) : error ? (
        <Card className="p-6 bg-destructive/10 text-destructive">{error}</Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {merchants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No merchants found.
                  </TableCell>
                </TableRow>
              ) : (
                merchants.map((merchant) => (
                  <TableRow key={merchant.id}>
                    <TableCell>
                      {editingMerchantId === merchant.id ? (
                        <Input
                          value={editingName}
                          onChange={(event) =>
                            setEditingName(event.target.value)
                          }
                        />
                      ) : (
                        <span className="font-medium text-foreground">
                          {merchant.name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          merchant.is_active
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {merchant.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {editingMerchantId === merchant.id ? (
                          <>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => onUpdateMerchant(merchant)}
                              disabled={actionLoading === merchant.id}
                              title="Save merchant name"
                            >
                              {actionLoading === merchant.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 text-emerald-500" />
                              )}
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMerchantId(null);
                                setEditingName("");
                              }}
                              title="Cancel"
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMerchantId(merchant.id);
                                setEditingName(merchant.name);
                              }}
                              title="Rename merchant"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="secondary"
                              onClick={() => onToggleActive(merchant)}
                              disabled={actionLoading === merchant.id}
                            >
                              {merchant.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
