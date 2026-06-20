"use server";

import {db} from "@/lib/db";
import {users, images, reports} from "@/lib/db/schema";
import {eq} from "drizzle-orm";
import {getServerAuthSession} from "@/lib/server-auth";
import {hasPermission, Permission} from "@/lib/permissions";
import {rename, mkdir} from "fs/promises";
import {join} from "path";
import {setModerationThreshold, type ModerationThresholds, type AzureThreshold} from "@/lib/site-settings";

export async function updateUserPermissions(userId: string, permissions: number) {
  const session = await getServerAuthSession();
  if (!session || !hasPermission(session.user.permissions, Permission.Admin)) {
    throw new Error("Unauthorized");
  }

  await db.update(users).set({permissions}).where(eq(users.id, userId));
}

export async function updateModerationThreshold(
  category: keyof ModerationThresholds,
  value: AzureThreshold | 'allow',
) {
  const session = await getServerAuthSession();
  if (!session || !hasPermission(session.user.permissions, Permission.Admin)) {
    throw new Error('Unauthorized');
  }
  await setModerationThreshold(category, value);
}

export async function dismissReport(reportId: string) {
  const session = await getServerAuthSession();
  if (!session || !hasPermission(session.user.permissions, Permission.Admin)) {
    throw new Error("Unauthorized");
  }
  await db.update(reports).set({reviewed: true}).where(eq(reports.id, reportId));
}

export async function deleteUser(userId: string) {
  const session = await getServerAuthSession();
  if (!session || !hasPermission(session.user.permissions, Permission.Admin)) {
    throw new Error("Unauthorized");
  }
  if (userId === session.user.id) {
    throw new Error("Cannot delete your own account");
  }

  const userImages = await db
    .select({filename: images.filename})
    .from(images)
    .where(eq(images.uploadedBy, userId));

  // Cascade delete handles DB rows; move files to __deleted for later cleanup.
  await db.delete(users).where(eq(users.id, userId));

  if (userImages.length > 0) {
    const uploadsDir = join(process.cwd(), "public", "uploads");
    const deletedDir = join(uploadsDir, "__deleted");
    await mkdir(deletedDir, {recursive: true});

    await Promise.allSettled(
      userImages.map(({filename}) =>
        rename(join(uploadsDir, filename), join(deletedDir, filename))
      )
    );
  }
}
