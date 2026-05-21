'use client';

import { Card } from '@/components/ui/card';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-2">Track and record customer payments</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Payments management coming soon...</p>
      </Card>
    </div>
  );
}
