'use client';

import { Card } from '@/components/ui/card';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-2">Add, edit, and manage user accounts</p>
      </div>

      <Card className="p-6">
        <p className="text-muted-foreground">User management coming soon...</p>
      </Card>
    </div>
  );
}
