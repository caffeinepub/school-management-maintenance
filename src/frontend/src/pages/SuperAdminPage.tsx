import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Principal } from "@icp-sdk/core/principal";
import { Loader2, Pencil, Plus, Save, Shield, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import {
  useAllUserProfiles,
  useSetUserProfileForPrincipal,
} from "../hooks/useQueries";

const ROLE_OPTIONS = [
  { value: "teacher", label: "Teacher" },
  { value: "authority", label: "Authority" },
  { value: "admin", label: "Admin Staff" },
];

function roleBadge(role: string) {
  if (role === "teacher")
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
        Teacher
      </Badge>
    );
  if (role === "authority")
    return (
      <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
        Authority
      </Badge>
    );
  if (role === "admin")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        Admin Staff
      </Badge>
    );
  return <Badge variant="outline">{role}</Badge>;
}

function truncatePrincipal(p: Principal) {
  const s = p.toString();
  if (s.length <= 20) return s;
  return `${s.slice(0, 10)}...${s.slice(-6)}`;
}

interface EditRowState {
  principalStr: string;
  name: string;
  role: string;
}

function AddUserDialog({
  onAdd,
  isPending,
}: {
  onAdd: (principalStr: string, profile: UserProfile) => Promise<void>;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [principalStr, setPrincipalStr] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("teacher");

  const handleSubmit = async () => {
    if (!principalStr.trim() || !name.trim()) {
      toast.error("Principal ID and name are required.");
      return;
    }
    await onAdd(principalStr.trim(), { name: name.trim(), role });
    setPrincipalStr("");
    setName("");
    setRole("teacher");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          data-ocid="superadmin.add_user.open_modal_button"
          className="gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="superadmin.add_user.dialog">
        <DialogHeader>
          <DialogTitle>Add User Profile</DialogTitle>
          <DialogDescription>
            Enter the user&apos;s Internet Identity Principal ID to create a
            profile for them.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="add-principal">Principal ID</Label>
            <Input
              id="add-principal"
              data-ocid="superadmin.add_user.input"
              placeholder="aaaaa-bbbbb-ccccc-ddddd-eee"
              value={principalStr}
              onChange={(e) => setPrincipalStr(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-name">Full Name</Label>
            <Input
              id="add-name"
              data-ocid="superadmin.add_user_name.input"
              placeholder="e.g. Ali Hassan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger
                id="add-role"
                data-ocid="superadmin.add_user_role.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-ocid="superadmin.add_user.cancel_button"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            data-ocid="superadmin.add_user.submit_button"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SuperAdminPage() {
  const { data: profiles, isLoading } = useAllUserProfiles();
  const setProfile = useSetUserProfileForPrincipal();
  const [editRow, setEditRow] = useState<EditRowState | null>(null);

  const handleSave = async (principal: Principal) => {
    if (!editRow) return;
    try {
      await setProfile.mutateAsync({
        user: principal,
        profile: { name: editRow.name, role: editRow.role },
      });
      toast.success("Profile updated successfully.");
      setEditRow(null);
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handleAddUser = async (principalStr: string, profile: UserProfile) => {
    let principal: Principal;
    try {
      // Dynamic import to avoid issues at top-level
      const { Principal } = await import("@icp-sdk/core/principal");
      principal = Principal.fromText(principalStr);
    } catch {
      toast.error("Invalid Principal ID. Please check and try again.");
      return;
    }
    try {
      await setProfile.mutateAsync({ user: principal, profile });
      toast.success("User profile created successfully.");
    } catch {
      toast.error("Failed to create profile. Please try again.");
    }
  };

  return (
    <div className="space-y-6" data-ocid="superadmin.page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage profiles for all system users
            </p>
          </div>
        </div>
        <AddUserDialog onAdd={handleAddUser} isPending={setProfile.isPending} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div
            className="p-6 space-y-3"
            data-ocid="superadmin.table.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : !profiles || profiles.length === 0 ? (
          <div
            className="py-16 text-center text-muted-foreground"
            data-ocid="superadmin.table.empty_state"
          >
            <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No users registered yet</p>
            <p className="text-sm mt-1">Add a user to get started.</p>
          </div>
        ) : (
          <Table data-ocid="superadmin.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold">Principal ID</TableHead>
                <TableHead className="font-semibold">Full Name</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(([principal, profile], idx) => {
                const principalStr = principal.toString();
                const isEditing = editRow?.principalStr === principalStr;
                return (
                  <TableRow
                    key={principalStr}
                    data-ocid={`superadmin.table.row.${idx + 1}`}
                    className={isEditing ? "bg-primary/5" : ""}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <span title={principalStr}>
                        {truncatePrincipal(principal)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          data-ocid="superadmin.edit_name.input"
                          value={editRow.name}
                          onChange={(e) =>
                            setEditRow((prev) =>
                              prev ? { ...prev, name: e.target.value } : prev,
                            )
                          }
                          className="h-8 text-sm"
                        />
                      ) : (
                        <span className="font-medium">{profile.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editRow.role}
                          onValueChange={(v) =>
                            setEditRow((prev) =>
                              prev ? { ...prev, role: v } : prev,
                            )
                          }
                        >
                          <SelectTrigger
                            className="h-8 text-sm w-36"
                            data-ocid="superadmin.edit_role.select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        roleBadge(profile.role)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            data-ocid="superadmin.edit.cancel_button"
                            onClick={() => setEditRow(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            data-ocid="superadmin.edit.save_button"
                            onClick={() => handleSave(principal)}
                            disabled={setProfile.isPending}
                          >
                            {setProfile.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          data-ocid={`superadmin.table.item.${idx + 1}.edit_button`}
                          onClick={() =>
                            setEditRow({
                              principalStr,
                              name: profile.name,
                              role: profile.role,
                            })
                          }
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
