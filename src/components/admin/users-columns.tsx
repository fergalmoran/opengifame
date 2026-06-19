"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {ColumnDef} from "@tanstack/react-table";
import {Trash2} from "lucide-react";
import {UserAvatar} from "@/components/user-avatar";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Label} from "@/components/ui/label";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {hasPermission, Permission, PERMISSION_LABELS} from "@/lib/permissions";
import {updateUserPermissions, deleteUser} from "@/app/admin/actions";

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  slug: string | null;
  permissions: number;
}

function PermissionsCell({user}: {user: UserRow}) {
  const [permissions, setPermissions] = useState(user.permissions);
  const [isPending, startTransition] = useTransition();

  function togglePermission(flag: Permission, checked: boolean) {
    let next: number;
    if (flag === Permission.Admin) {
      next = checked ? Permission.Admin : Permission.None;
    } else if (checked) {
      const base = permissions === Permission.Admin ? 0 : permissions;
      next = base | flag;
    } else {
      next = permissions & ~flag;
    }
    setPermissions(next);
    startTransition(async () => {
      await updateUserPermissions(user.id, next);
    });
  }

  const isAdmin = permissions === Permission.Admin;

  return (
    <div className="flex flex-wrap gap-4">
      {PERMISSION_LABELS.map(({flag, label}) => (
        <div key={flag} className="flex items-center gap-1.5">
          <Checkbox
            id={`${user.id}-${flag}`}
            checked={flag === Permission.Admin ? isAdmin : hasPermission(permissions, flag)}
            disabled={isPending}
            onCheckedChange={(checked) => togglePermission(flag, !!checked)}
          />
          <Label htmlFor={`${user.id}-${flag}`} className="text-sm cursor-pointer">
            {label}
          </Label>
        </div>
      ))}
    </div>
  );
}

function DeleteCell({user, isSelf}: {user: UserRow; isSelf: boolean}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function confirmDelete() {
    startTransition(async () => {
      await deleteUser(user.id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={isSelf}
        title={isSelf ? "Cannot delete your own account" : `Delete ${user.name ?? user.email}`}
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4"/>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <span className="font-medium text-foreground">{user.name ?? user.email}</span> and all their content. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function getUsersColumns(currentUserId: string): ColumnDef<UserRow>[] {
  return [
    {
      id: "user",
      header: "User",
      cell: ({row}) => {
        const {name, email, image} = row.original;
        return (
          <div className="flex items-center gap-3">
            <UserAvatar src={image} name={name} size={32}/>
            <div>
              <div className="font-medium text-sm">{name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({row}) => (
        <span className="text-sm text-muted-foreground">
          {row.original.slug ? `@${row.original.slug}` : "—"}
        </span>
      ),
    },
    {
      id: "permissions",
      header: "Permissions",
      cell: ({row}) => <PermissionsCell user={row.original}/>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({row}) => (
        <div className="flex justify-end">
          <DeleteCell user={row.original} isSelf={row.original.id === currentUserId}/>
        </div>
      ),
    },
  ];
}
