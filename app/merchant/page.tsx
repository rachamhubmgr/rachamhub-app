"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function MerchantIndex() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("merchant_role");
    if (!role) {
      router.replace("/merchant/login");
    } else if (role === "admin") {
      router.replace("/merchant/approvals");
    } else {
      router.replace("/merchant/stock");
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
