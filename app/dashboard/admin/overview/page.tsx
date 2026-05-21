'use client';

import { Card } from '@/components/ui/card';

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Overview</h1>
        <p className="text-muted-foreground mt-2">View detailed system analytics and metrics</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">System analytics coming soon...</p>
      </Card>
    </div>
  );
}
