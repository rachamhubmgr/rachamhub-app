'use client';

import { Card } from '@/components/ui/card';

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">Track stock levels and manage items</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Inventory management coming soon...</p>
      </Card>
    </div>
  );
}
