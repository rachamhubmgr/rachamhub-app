'use client';

import { Card } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground mt-2">Configure system parameters and integrations</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">System settings coming soon...</p>
      </Card>
    </div>
  );
}
