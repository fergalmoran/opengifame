import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { images, tags, imageTags } from '@/lib/db/schema';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { eq } from 'drizzle-orm';
import { generateRandomTitle } from '@/lib/title-utils';
import { generateUniqueSlug } from '@/lib/slug-utils';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User ID:', session.user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tagsInput = formData.get('tags') as string;

    console.log('Processing file:', file?.name);
    console.log('Form data - Title:', title, 'Description:', description, 'Tags:', tagsInput);

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filepath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Create image record
    console.log('Creating image record in database...');
    const imageUrl = `/uploads/${filename}`;
    const imageTitle = title?.trim() || generateRandomTitle(); // Generate a fun random title when none is provided
    const slug = await generateUniqueSlug(imageTitle); // Lowercase, unique, URL-friendly identifier
    const [newImage] = await db
      .insert(images)
      .values({
        title: imageTitle,
        slug,
        description: description || null,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: imageUrl,
        uploadedBy: session.user.id,
      })
      .returning();

    console.log('Image created with ID:', newImage.id);

    // Process tags
    if (tagsInput) {
      const tagNames = tagsInput
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      for (const tagName of tagNames) {
        // Check if tag exists, create if not
        const existingTag = await db
          .select()
          .from(tags)
          .where(eq(tags.name, tagName))
          .limit(1);

        let tagId;
        if (existingTag.length === 0) {
          const [newTag] = await db
            .insert(tags)
            .values({
              name: tagName,
              createdBy: session.user.id,
            })
            .returning();
          tagId = newTag.id;
        } else {
          tagId = existingTag[0].id;
        }

        // Link tag to image
        await db.insert(imageTags).values({
          imageId: newImage.id,
          tagId,
        });
      }
    }

    return NextResponse.json({
      id: newImage.id,
      slug: newImage.slug,
      url: imageUrl,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
