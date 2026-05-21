'use client';

import { Card } from '@/components/ui/card';

export default function InquiriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customer Inquiries</h1>
        <p className="text-muted-foreground mt-2">Respond to customer questions and issues</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">Customer inquiries list coming soon...</p>
      </Card>
    </div>
  );
}
