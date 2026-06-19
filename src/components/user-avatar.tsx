'use client';

import {useState} from 'react';
import Image from 'next/image';
import {cn} from '@/lib/utils';
import {getUserInitials} from '@/lib/user-utils';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  /** Rendered size in pixels (used for both layout and next/image sizing). */
  size?: number;
  className?: string;
}

/**
 * Circular user avatar backed by next/image, which handles the resizing /
 * optimization. Falls back to the user's initials when there is no image or
 * the image fails to load.
 */
export function UserAvatar({src, name, size = 40, className}: UserAvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = Boolean(src) && !errored;

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border bg-muted flex items-center justify-center',
        className
      )}
      style={{width: size, height: size}}
    >
      {showImage ? (
        <Image
          src={src as string}
          alt={name || 'User'}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span
          className="font-medium text-muted-foreground"
          style={{fontSize: Math.max(10, Math.round(size * 0.4))}}
        >
          {getUserInitials(name)}
        </span>
      )}
    </div>
  );
}
