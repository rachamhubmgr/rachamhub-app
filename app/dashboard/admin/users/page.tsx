"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserPlus, Edit, ShieldAlert, Key } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<any>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [form, setForm] = useState({
    email: "",
    display_name: "",
    role: "fom",
    is_active: true,
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase!
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) toast.error("Error fetching users");
    else setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setForm({
        email: user.email,
        display_name: user.display_name,
        role: user.role,
        is_active: user.is_active ?? true,
      });
    } else {
      setEditingUser(null);
      setForm({ email: "", display_name: "", role: "fom", is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!form.email || !form.display_name) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      if (editingUser) {
        const { error } = await supabase!
          .from("users")
          .update({
            display_name: form.display_name,
            role: form.role,
            is_active: form.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingUser.id);
        if (error) throw error;
        toast.success("User updated successfully");
      } else {
        // Create a new auth user via the protected admin API
        const { data: sessionData } = await supabase!.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Not authenticated");

        const res = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: form.email,
            displayName: form.display_name,
            role: form.role,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to create user");
        }
        toast.success("User created — temporary password emailed (or shipped)");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleResetPassword = (user: any) => {
    setPasswordTargetUser(user);
    setPasswordValue("");
    setPasswordModalOpen(true);
  };

  const submitNewPassword = async () => {
    if (!passwordValue || passwordValue.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    const doUpdate = async () => {
      const { data: sessionData } = await supabase!.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: passwordTargetUser.id,
          password: passwordValue,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to set password");
      return json;
    };

    try {
      await toast.promise(doUpdate(), {
        loading: "Updating password...",
        success: `Password updated for ${passwordTargetUser.email}`,
        error: "Error updating password",
      });
      setPasswordModalOpen(false);
      setPasswordTargetUser(null);
      setPasswordValue("");
      fetchUsers();
    } catch (e) {
      // already handled by toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage roles, permissions, and account status.
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <UserPlus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium text-xs">{u.display_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {u.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[10px]">
                      {u.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.is_active !== false ? "default" : "destructive"
                      }
                      className="text-[10px]"
                    >
                      {u.is_active !== false ? "Active" : "Deactivated"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[10px]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleResetPassword(u)}
                        title="Reset Password"
                      >
                        <Key className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(u)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user details and permissions."
                : "Create a new user account."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={form.display_name}
                onChange={(e) =>
                  setForm({ ...form, display_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                disabled={!!editingUser}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="customer_service">Customer Service</option>
                <option value="warehouse">Warehouse</option>
                <option value="fom">Fleet Operator (FOM)</option>
                <option value="accounting">Accounting</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Account Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set New Password</DialogTitle>
            <DialogDescription>
              Set a new password for {passwordTargetUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitNewPassword}>Set Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
