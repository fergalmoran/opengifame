import {getServerAuthSession} from "@/lib/server-auth";
import {hasPermission, Permission} from "@/lib/permissions";
import {redirect} from "next/navigation";
import {db} from "@/lib/db";
import {users, images, reports} from "@/lib/db/schema";
import {desc, eq} from "drizzle-orm";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {UsersTab} from "@/components/admin/users-tab";
import {ReportsTab} from "@/components/admin/reports-tab";
import {SettingsTab} from "@/components/admin/settings-tab";
import {getModerationThresholds} from "@/lib/site-settings";

export default async function AdminPage() {
  const session = await getServerAuthSession();

  if (!session || !hasPermission(session.user.permissions, Permission.Admin)) {
    redirect("/");
  }

  const [allUsers, allReports, thresholds] = await Promise.all([
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      slug: users.slug,
      permissions: users.permissions,
    })
      .from(users)
      .orderBy(users.name),

    db.select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      reporterIp: reports.reporterIp,
      reporterName: users.name,
      reviewed: reports.reviewed,
      createdAt: reports.createdAt,
      imageSlug: images.slug,
      imageTitle: images.title,
      imageUrl: images.url,
    })
      .from(reports)
      .leftJoin(images, eq(reports.imageId, images.id))
      .leftJoin(users, eq(reports.reporterId, users.id))
      .orderBy(desc(reports.createdAt)),

    getModerationThresholds(),
  ]);

  const pendingCount = allReports.filter(r => !r.reviewed).length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin</h1>
      <Tabs defaultValue={pendingCount > 0 ? "reports" : "users"}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 leading-none">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersTab users={allUsers} currentUserId={session.user.id}/>
        </TabsContent>
        <TabsContent value="reports">
          <ReportsTab reports={allReports as Parameters<typeof ReportsTab>[0]["reports"]}/>
        </TabsContent>
        <TabsContent value="settings">
          <SettingsTab thresholds={thresholds}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}
