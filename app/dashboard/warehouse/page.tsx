'use client';

import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle2, AlertCircle, Package, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function WarehouseDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Items in Stock',
      value: '1,234',
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Low Stock Alerts',
      value: '5',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Orders Processed',
      value: '42',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Capacity Used',
      value: '78%',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Warehouse Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage inventory and track warehouse operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Warehouse Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Inventory Management</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage warehouse stock levels
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Order Processing</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Pick and pack orders for shipment
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Receiving</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Log incoming stock and deliveries
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Reports</h3>
            <p className="text-sm text-muted-foreground mt-1">
              View warehouse metrics and analytics
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
