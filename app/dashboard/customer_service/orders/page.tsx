'use client';

import { Card } from '@/components/ui/card';

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground mt-2">View and manage customer orders</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Orders list coming soon...</p>
      </Card>
    </div>
  );
}
