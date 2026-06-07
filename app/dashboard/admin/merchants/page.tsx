"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DataTable, { type DataTableColumn } from "@/components/data-table";
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

  const columns: DataTableColumn[] = [
    {
      key: "name",
      label: "Name",
      render: (row) =>
        editingMerchantId === row.id ? (
          <Input
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
          />
        ) : (
          <span className="font-medium text-foreground">{row.name}</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            row.is_active
              ? "bg-emerald-100 text-emerald-900"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {row.is_active ? "Active" : "Deactivated"}
        </span>
      ),
    },
  ];

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
          <DataTable
            headers={columns}
            rows={merchants}
            searchPlaceholder="Search merchants..."
            renderRowActions={(row) => (
              <div className="flex justify-end gap-2">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() =>
                    editingMerchantId === row.id
                      ? onUpdateMerchant(row)
                      : (setEditingMerchantId(row.id), setEditingName(row.name))
                  }
                  title={
                    editingMerchantId === row.id
                      ? "Save merchant"
                      : "Edit merchant"
                  }
                >
                  {editingMerchantId === row.id ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Edit2 className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onToggleActive(row)}
                  title="Toggle active"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          />
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
