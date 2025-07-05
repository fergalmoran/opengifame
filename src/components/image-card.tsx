'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreDisplay } from '@/components/ui/stats-display';
import { ArrowUp, ArrowDown, MessageCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

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

  const formatHumanDate = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isYesterday(date)) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

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
    <Card className="overflow-hidden hover-lift transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/image/${id}`}
            className="text-lg font-semibold hover:text-primary transition-colors duration-200"
          >
            {title}
          </Link>
          <ScoreDisplay score={score} size="sm" />
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Link href={`/image/${id}`}>
          <div className="relative aspect-video w-full overflow-hidden group">
            <Image
              src={url}
              alt={title}
              fill
              className="object-cover transition-all duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
              className={`transition-all duration-200 ${
                currentVote === 'up' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-900/30'
              }`}
            >
              <ArrowUp className="h-4 w-4" />
              {voteCount.upvotes}
            </Button>
            <Button
              variant={currentVote === 'down' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleVote('down')}
              disabled={!session}
              className={`transition-all duration-200 ${
                currentVote === 'down' 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/30'
              }`}
            >
              <ArrowDown className="h-4 w-4" />
              {voteCount.downvotes}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild className="hover:bg-accent hover:text-accent-foreground">
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
            <span>{formatHumanDate(createdAt)}</span>
          </div>
          <span className="font-medium">by {uploadedBy.name}</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                size="sm"
                href={`/tag/${tag.name}`}
                className="hover:bg-secondary/80"
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
