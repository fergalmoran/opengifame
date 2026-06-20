import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {db} from '@/lib/db';
import {images, reports} from '@/lib/db/schema';
import {eq} from 'drizzle-orm';

const VALID_REASONS = [
  'csam',
  'non_consensual',
  'violence',
  'spam',
  'other',
] as const;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {imageId, reason, details} = body;

  if (!imageId || !reason || !VALID_REASONS.includes(reason)) {
    return NextResponse.json({error: 'Invalid request'}, {status: 400});
  }

  const image = await db.select({id: images.id}).from(images).where(eq(images.id, imageId)).limit(1);
  if (image.length === 0) {
    return NextResponse.json({error: 'Image not found'}, {status: 404});
  }

  const session = await getServerSession(authOptions);
  const reporterIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    null;

  await db.insert(reports).values({
    imageId,
    reason,
    details: details?.trim() || null,
    reporterIp,
    reporterId: session?.user?.id ?? null,
  });

  console.warn('[report] image reported', {imageId, reason, reporterIp});

  return NextResponse.json({message: 'Report submitted'});
}
