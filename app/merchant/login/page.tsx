"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight, ShieldCheck, User } from "lucide-react";
import Image from "next/image";

export default function MerchantLoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "warehouse" | "guest" | null>(
    null,
  );
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!role) return;

    if (role === "guest") {
      localStorage.setItem("merchant_role", "guest");
      toast.success("Logged in as Guest");
      router.push("/merchant/stock");
      return;
    }

    if (!accessKey) {
      toast.error("Access key is required for this role");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase!
        .from("merchant_access_keys")
        .select("*")
        .eq("role", role)
        .eq("access_key", accessKey)
        .single();

      if (error || !data) {
        throw new Error("Invalid access key");
      }

      localStorage.setItem("merchant_role", role);
      toast.success(`Logged in as ${role.toUpperCase()}`);
      router.push(role === "admin" ? "/merchant/approvals" : "/merchant/stock");
    } catch (err) {
      toast.error("Invalid access key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
            <Image
              src="/rachamhub-logo.jpeg"
              alt="RachamHub Logo"
              width={50}
              height={50}
              className="rounded-lg"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Merchant Dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Select your role to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:shadow sm:rounded-lg sm:px-10 border-0 shadow-xl">
          {!role ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-4 text-lg font-medium"
                onClick={() => setRole("admin")}
              >
                <ShieldCheck className="h-6 w-6 text-primary" />
                Admin / Manager
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-4 text-lg font-medium"
                onClick={() => setRole("warehouse")}
              >
                <ShieldCheck className="h-6 w-6 text-amber-600" />
                Warehouse Staff
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-4 text-lg font-medium"
                onClick={() => setRole("guest")}
              >
                <User className="h-6 w-6 text-slate-500" />
                Guest Access
              </Button>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold capitalize">
                    {role} Login
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {role === "guest"
                      ? "No access key required."
                      : "Enter your secondary access key."}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setRole(null);
                    setAccessKey("");
                  }}
                >
                  Change Role
                </Button>
              </div>

              {role !== "guest" && (
                <div className="space-y-2">
                  <Label htmlFor="accessKey">Access Key</Label>
                  <Input
                    id="accessKey"
                    type="password"
                    placeholder="Enter access key..."
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    autoFocus
                  />
                </div>
              )}

              <Button
                className="w-full h-12 text-base font-medium"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
        <div className="mt-6 text-center">
          <Button
            variant="link"
            className="text-sm text-slate-500"
            onClick={() => router.push("/dashboard")}
          >
            &larr; Back to Main Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
