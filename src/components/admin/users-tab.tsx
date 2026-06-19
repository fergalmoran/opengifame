"use client";

import {DataTable} from "@/components/admin/data-table";
import {getUsersColumns, type UserRow} from "@/components/admin/users-columns";

export function UsersTab({users, currentUserId}: {users: UserRow[]; currentUserId: string}) {
  return <DataTable columns={getUsersColumns(currentUserId)} data={users}/>;
}
