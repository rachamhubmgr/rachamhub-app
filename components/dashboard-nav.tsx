"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Package,
  Warehouse,
  DollarSign,
  Users,
  Settings,
  MessageSquare,
  Zap,
  Home,
  TrendingUp,
  Layers,
  Store,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

/**
 * Role-based sidebar navigation
 * Shows different menu items based on user role
 */
interface DashboardNavProps {
  className?: string;
}

export default function DashboardNav({ className }: DashboardNavProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("[Dashboard Nav] Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  // Define role-specific menu items
  const getMenuItems = () => {
    const baseItems = [
      {
        label: "Orders",
        href: `/dashboard/${user.role}/orders`,
        icon: Package,
      },
    ];

    const roleMenus: Record<string, typeof baseItems> = {
      customer_service: [
        // {
        //   label: "Home",
        //   href: `/dashboard/${user.role}/`,
        //   icon: Home,
        // },
        {
          label: "Home",
          href: `/dashboard/${user.role}/`,
          icon: Home,
        },
        {
          label: "Orders",
          href: `/dashboard/${user.role}/orders`,
          icon: Package,
        },
        // {
        //   label: "Inquiries",
        //   href: `/dashboard/${user.role}/inquiries`,
        //   icon: MessageSquare,
        // },
      ],
      warehouse: [
        {
          label: "Warehouse",
          href: `/dashboard/${user.role}/`,
          icon: Store,
        },
        // {
        //   label: "Orders",
        //   href: `/dashboard/${user.role}/orders`,
        //   icon: Package,
        // },
        {
          label: "Inventory",
          href: `/dashboard/${user.role}/inventory`,
          icon: Warehouse,
        },
      ],
      fom: [
        {
          label: "Home",
          href: `/dashboard/${user.role}/`,
          icon: Home,
        },
        {
          label: "Orders",
          href: `/dashboard/${user.role}/orders`,
          icon: Package,
        },
      ],
      accounting: [
        {
          label: "Overview",
          href: `/dashboard/${user.role}/`,
          icon: Home,
        },
        {
          label: "Invoices",
          href: `/dashboard/${user.role}/invoices`,
          icon: DollarSign,
        },
        {
          label: "Payments",
          href: `/dashboard/${user.role}/payments`,
          icon: DollarSign,
        },
      ],
      admin: [
        {
          label: "Overview",
          href: `/dashboard/${user.role}/`,
          icon: Package,
        },
        {
          label: "Orders",
          href: `/dashboard/${user.role}/orders`,
          icon: TrendingUp,
        },
        // {
        //   label: "Merchants",
        //   href: `/dashboard/${user.role}/merchants`,
        //   icon: Layers,
        // },
        {
          label: "Users",
          href: `/dashboard/${user.role}/users`,
          icon: Users,
        },
        {
          label: "Settings",
          href: `/dashboard/${user.role}/settings`,
          icon: Settings,
        },
      ],
    };

    // If role has a specific menu, return it, otherwise fall back to baseItems
    return roleMenus[user.role] || baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={cn(
        "w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full",
        className,
      )}
    >
      {/* Logo Section */}
      <div className="border-b border-sidebar-border p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Image
              src="/rachamhub-logo.jpeg"
              alt="RachamHub Logo"
              width={35}
              height={35}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-sidebar-foreground">RachamHub</h2>
            <p className="text-xs text-sidebar-foreground/60">Limited</p>
          </div>
        </Link>
      </div>

      {/* User Info Section */}
      <div className="border-b border-sidebar-border p-4 bg-sidebar-primary/10">
        <p className="text-xs text-sidebar-foreground/60 uppercase tracking-wide">
          {ROLE_LABELS[user.role]}
        </p>
        <p className="text-sm font-medium text-sidebar-foreground truncate">
          {user.displayName}
        </p>
        <p className="text-xs text-sidebar-foreground/60 truncate">
          {user.email}
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const normalizedPathname = pathname?.replace(/\/$/, "") || "";
          const normalizedHref = item.href.replace(/\/$/, "");
          const isActive = normalizedPathname === normalizedHref;

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-sidebar-foreground rounded-md",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Section */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-sidebar-border"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-5 w-5" />
          <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
        </Button>
      </div>
    </aside>
  );
}
