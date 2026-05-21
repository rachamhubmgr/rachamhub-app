'use client';

import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Users, Package, Activity, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Users',
      value: '45',
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Orders',
      value: '892',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'System Health',
      value: '98%',
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Revenue',
      value: '₦12.5M',
      icon: BarChart3,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Administration Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, system settings, and view company-wide metrics
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

      {/* Admin Functions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Administrative Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">User Management</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add, edit, and manage user accounts and roles
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">System Settings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure system parameters and integrations
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Activity Logs</h3>
            <p className="text-sm text-muted-foreground mt-1">
              View system audit logs and user activities
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Reports & Analytics</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generate comprehensive system reports
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Backup & Recovery</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage system backups and data recovery
            </p>
          </div>
          <div className="p-4 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition">
            <h3 className="font-medium text-foreground">Security Settings</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Configure authentication and access control
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
