import {getServerAuthSession} from "@/lib/server-auth";
import {hasPermission, Permission} from "@/lib/permissions";
import {redirect} from "next/navigation";
import {db} from "@/lib/db";
import {users} from "@/lib/db/schema";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {UsersTab} from "@/components/admin/users-tab";

export default async function AdminPage() {
  const session = await getServerAuthSession();

  if (!session || !hasPermission(session.user.permissions, Permission.Admin)) {
    redirect("/");
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      slug: users.slug,
      permissions: users.permissions,
    })
    .from(users)
    .orderBy(users.name);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin</h1>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersTab users={allUsers} currentUserId={session.user.id}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}
