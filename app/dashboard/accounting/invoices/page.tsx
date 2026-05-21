'use client';

import { Card } from '@/components/ui/card';

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
        <p className="text-muted-foreground mt-2">Create and manage customer invoices</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Invoices management coming soon...</p>
      </Card>
    </div>
  );
}
