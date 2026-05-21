'use client';

import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AccountingDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Revenue',
      value: '₦5.2M',
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Pending Invoices',
      value: '23',
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Paid This Month',
      value: '₦2.8M',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Outstanding',
      value: '₦890K',
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Accounting Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor financial transactions and billing
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
        <h2 className="text-lg font-semibold text-foreground mb-4">Accounting Functions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Generate Invoices</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create and send invoices to customers
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Payment Tracking</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and record incoming payments
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Financial Reports</h3>
            <p className="text-sm text-muted-foreground mt-1">
              View detailed financial analytics
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Reconciliation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Reconcile accounts and balances
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
