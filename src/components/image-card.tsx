'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, MessageCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ImageCardProps {
  id: string;
  title: string;
  description?: string;
  url: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  uploadedBy: {
    name?: string;
    image?: string;
  };
  tags: {
    id: string;
    name: string;
  }[];
  userVote?: 'up' | 'down' | null;
  commentCount: number;
}

export function ImageCard({
  id,
  title,
  description,
  url,
  upvotes,
  downvotes,
  createdAt,
  uploadedBy,
  tags,
  userVote,
  commentCount,
}: ImageCardProps) {
  const { data: session } = useSession();
  const [currentVote, setCurrentVote] = useState(userVote);
  const [voteCount, setVoteCount] = useState({ upvotes, downvotes });

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!session) return;

    try {
      const response = await fetch('/api/images/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId: id, isUpvote: voteType === 'up' }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentVote(data.userVote);
        setVoteCount({ upvotes: data.upvotes, downvotes: data.downvotes });
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const score = voteCount.upvotes - voteCount.downvotes;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/image/${id}`}
            className="text-lg font-semibold hover:text-primary"
          >
            {title}
          </Link>
          <span className="text-sm text-muted-foreground">
            {score > 0 ? `+${score}` : score}
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Link href={`/image/${id}`}>
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={url}
              alt={title}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
        </Link>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 pt-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant={currentVote === 'up' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote('up')}
              disabled={!session}
            >
              <ArrowUp className="h-4 w-4" />
              {voteCount.upvotes}
            </Button>
            <Button
              variant={currentVote === 'down' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote('down')}
              disabled={!session}
            >
              <ArrowDown className="h-4 w-4" />
              {voteCount.downvotes}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/image/${id}`}>
                <MessageCircle className="mr-1 h-4 w-4" />
                {commentCount}
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{createdAt.toLocaleDateString()}</span>
          </div>
          <span>by {uploadedBy.name}</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.name}`}
                className="rounded-full bg-secondary px-2 py-1 text-xs hover:bg-secondary/80"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
