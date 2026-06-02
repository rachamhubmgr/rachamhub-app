"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Building2,
  Settings2,
  Truck,
  MapPin,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [newMerchant, setNewMerchant] = useState("");
  const [newRider, setNewRider] = useState("");
  const [newRiderPhone, setNewRiderPhone] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newLandmarkPrice, setNewLandmarkPrice] = useState("");
  const [settings, setSettings] = useState({
    order_prefix: "RCH-",
    session_timeout: "60",
    fom_names: "FOM1,FOM2,FOM3",
  });

  const fetchMerchants = async () => {
    const { data } = await supabase!
      .from("merchants")
      .select("*")
      .order("name");
    if (data) setMerchants(data);
  };

  const fetchRiders = async () => {
    const { data } = await supabase!.from("riders").select("*").order("name");
    if (data) setRiders(data);
  };

  const fetchLandmarks = async () => {
    const { data } = await supabase!
      .from("landmarks")
      .select("*")
      .order("name");
    if (data) setLandmarks(data);
  };

  useEffect(() => {
    fetchMerchants();
    fetchRiders();
    fetchLandmarks();
    // load system settings
    (async () => {
      const { data } = await supabase!.from("settings").select("key, value");
      if (data) {
        const map: any = {};
        data.forEach((r: any) => (map[r.key] = r.value));
        setSettings({
          order_prefix: map.order_prefix ?? settings.order_prefix,
          session_timeout: map.session_timeout ?? settings.session_timeout,
          fom_names: map.fom_names ?? settings.fom_names,
        });
      }
    })();
  }, []);

  const handleAddMerchant = async () => {
    if (!newMerchant) return;
    const { error } = await supabase!
      .from("merchants")
      .insert([{ name: newMerchant }]);
    if (error) toast.error("Failed to add merchant");
    else {
      toast.success("Merchant added");
      setNewMerchant("");
      fetchMerchants();
    }
  };

  const handleDeactivateMerchant = async (id: string, current: boolean) => {
    const { error } = await supabase!
      .from("merchants")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) toast.error("Action failed");
    else fetchMerchants();
  };

  const handleAddRider = async () => {
    if (!newRider || !newRiderPhone) {
      toast.error("Please fill in all fields");
      return;
    }
    const { error } = await supabase!
      .from("riders")
      .insert([{ name: newRider, phone: newRiderPhone }]);
    if (error) toast.error("Failed to add rider");
    else {
      toast.success("Rider added");
      setNewRider("");
      setNewRiderPhone("");
      fetchRiders();
    }
  };

  const handleDeactivateRider = async (id: string, current: boolean) => {
    const { error } = await supabase!
      .from("riders")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) toast.error("Action failed");
    else fetchRiders();
  };

  const handleAddLandmark = async () => {
    if (!newLandmark || !newLandmarkPrice) {
      toast.error("Please fill in all fields");
      return;
    }
    const { error } = await supabase!
      .from("landmarks")
      .insert([{ name: newLandmark, price: Number(newLandmarkPrice) }]);
    if (error) toast.error("Failed to add landmark");
    else {
      toast.success("Landmark added");
      setNewLandmark("");
      setNewLandmarkPrice("");
      fetchLandmarks();
    }
  };

  const handleDeactivateLandmark = async (id: string, current: boolean) => {
    const { error } = await supabase!
      .from("landmarks")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) toast.error("Action failed");
    else fetchLandmarks();
  };

  const saveSettings = () => {
    (async () => {
      try {
        const payload = [
          { key: "order_prefix", value: settings.order_prefix },
          { key: "session_timeout", value: String(settings.session_timeout) },
          { key: "fom_names", value: settings.fom_names },
        ];
        const { error } = await supabase!
          .from("settings")
          .upsert(payload, { onConflict: "key" });
        if (error) throw error;
        toast.success("System settings saved");
      } catch (err) {
        toast.error("Failed to save settings");
      }
    })();
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Manage global configurations, merchants, riders, and landmarks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Merchant Management */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Merchants</h2>
          </div>

          <div className="flex gap-2 mb-6">
            <Input
              placeholder="New Merchant Name..."
              value={newMerchant}
              onChange={(e) => setNewMerchant(e.target.value)}
            />
            <Button onClick={handleAddMerchant}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {merchants.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div>
                  <p
                    className={`text-sm font-medium ${!m.is_active ? "line-through text-muted-foreground" : ""}`}
                  >
                    {m.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    m.is_active ? "text-destructive" : "text-emerald-600"
                  }
                  onClick={() => handleDeactivateMerchant(m.id, m.is_active)}
                >
                  {m.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Riders Management */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Riders</h2>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <div className="flex gap-2">
              <Input
                placeholder="Rider Name..."
                value={newRider}
                onChange={(e) => setNewRider(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Phone Number..."
                value={newRiderPhone}
                onChange={(e) => setNewRiderPhone(e.target.value)}
              />
              <Button onClick={handleAddRider}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {riders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div>
                  <p
                    className={`text-sm font-medium ${!r.is_active ? "line-through text-muted-foreground" : ""}`}
                  >
                    {r.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    r.is_active ? "text-destructive" : "text-emerald-600"
                  }
                  onClick={() => handleDeactivateRider(r.id, r.is_active)}
                >
                  {r.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Landmarks Management */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Landmarks & Prices</h2>
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <div className="flex gap-2">
              <Input
                placeholder="Landmark Name..."
                value={newLandmark}
                onChange={(e) => setNewLandmark(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Price (₦)..."
                value={newLandmarkPrice}
                onChange={(e) => setNewLandmarkPrice(e.target.value)}
              />
              <Button onClick={handleAddLandmark}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {landmarks.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div>
                  <p
                    className={`text-sm font-medium ${!l.is_active ? "line-through text-muted-foreground" : ""}`}
                  >
                    {l.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₦{Number(l.price).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={
                    l.is_active ? "text-destructive" : "text-emerald-600"
                  }
                  onClick={() => handleDeactivateLandmark(l.id, l.is_active)}
                >
                  {l.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* General Settings */}
        {/* <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">General Config</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Order ID Prefix</Label>
              <Input
                value={settings.order_prefix}
                onChange={(e) =>
                  setSettings({ ...settings, order_prefix: e.target.value })
                }
                placeholder="e.g. RCH-"
              />
              <p className="text-[10px] text-muted-foreground">
                This prefix will be applied to all new orders (e.g. RCH-001).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Session Timeout (Minutes)</Label>
              <Input
                type="number"
                value={settings.session_timeout}
                onChange={(e) =>
                  setSettings({ ...settings, session_timeout: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>FOM Assignee Labels (comma separated)</Label>
              <Input
                value={settings.fom_names}
                onChange={(e) =>
                  setSettings({ ...settings, fom_names: e.target.value })
                }
                placeholder="FOM1,FOM2,FOM3"
              />
              <p className="text-[10px] text-muted-foreground">
                Comma separated labels used when assigning orders to FOMs.
              </p>
            </div>

            <Button className="w-full mt-4" onClick={saveSettings}>
              Save System Configuration
            </Button>
          </div>
        </Card> */}
      </div>
    </div>
  );
}
