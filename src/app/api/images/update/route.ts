import {NextRequest, NextResponse} from 'next/server';
import {getServerAuthSession} from '@/lib/server-auth';
import {db} from '@/lib/db';
import {images, imageTags, tags} from '@/lib/db/schema';
import {and, eq, inArray} from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {error: 'Authentication required'},
        {status: 401}
      );
    }

    const userId = session.user.id;
    const {imageId, title, description, tags: tagsInput} = await request.json();

    if (!imageId) {
      return NextResponse.json({error: 'Image ID is required'}, {status: 400});
    }

    if (!title?.trim()) {
      return NextResponse.json({error: 'Title is required'}, {status: 400});
    }

    // Update core fields only if the user owns the image.
    const updated = await db
      .update(images)
      .set({
        title: title.trim(),
        description: description?.trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(images.id, imageId), eq(images.uploadedBy, userId)))
      .returning({id: images.id});

    if (updated.length === 0) {
      return NextResponse.json(
        {error: 'Image not found or you do not have permission to edit it'},
        {status: 404}
      );
    }

    // Normalize the incoming tag list (lowercase, trimmed, de-duplicated).
    const tagNames: string[] = Array.isArray(tagsInput)
      ? Array.from(
        new Set(
          tagsInput
            .map((t: string) => String(t).trim().toLowerCase())
            .filter((t: string) => t.length > 0)
        )
      )
      : [];

    // Resolve each tag name to an id, creating tags that don't exist yet.
    const tagIds: string[] = [];
    for (const tagName of tagNames) {
      const existing = await db
        .select({id: tags.id})
        .from(tags)
        .where(eq(tags.name, tagName))
        .limit(1);

      if (existing.length > 0) {
        tagIds.push(existing[0].id);
      } else {
        const [created] = await db
          .insert(tags)
          .values({name: tagName, createdBy: userId})
          .returning({id: tags.id});
        tagIds.push(created.id);
      }
    }

    // Reconcile the image_tags join table to exactly match the new set.
    const current = await db
      .select({tagId: imageTags.tagId})
      .from(imageTags)
      .where(eq(imageTags.imageId, imageId));

    const currentIds = new Set(current.map((row) => row.tagId));
    const nextIds = new Set(tagIds);

    const toRemove = [...currentIds].filter((id) => !nextIds.has(id));
    const toAdd = tagIds.filter((id) => !currentIds.has(id));

    if (toRemove.length > 0) {
      await db
        .delete(imageTags)
        .where(
          and(
            eq(imageTags.imageId, imageId),
            inArray(imageTags.tagId, toRemove)
          )
        );
    }

    if (toAdd.length > 0) {
      await db
        .insert(imageTags)
        .values(toAdd.map((tagId) => ({imageId, tagId})));
    }

    return NextResponse.json({success: true});
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      {error: 'Failed to update image'},
      {status: 500}
    );
  }
}
