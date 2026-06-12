import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string | null;
    const bio = formData.get('bio') as string | null;
    const avatar = formData.get('avatar') as File | null;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updateValues: { name: string; bio: string | null; image?: string } = {
      name: name.trim(),
      bio: bio?.trim() || null,
    };

    // Optional new avatar image.
    if (avatar && avatar.size > 0) {
      if (!avatar.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Avatar must be an image' },
          { status: 400 }
        );
      }

      const extension = avatar.name.split('.').pop() || 'png';
      const filename = `avatar-${session.user.id}-${Date.now()}.${extension}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(
        join(uploadDir, filename),
        Buffer.from(await avatar.arrayBuffer())
      );
      updateValues.image = `/uploads/${filename}`;
    }

    // A user can only ever update their own profile (id comes from the session).
    const [updated] = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, session.user.id))
      .returning({
        id: users.id,
        name: users.name,
        bio: users.bio,
        image: users.image,
      });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
