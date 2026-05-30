'use client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreDisplay } from '@/components/ui/stats-display';
import { MessageCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { VotingButtons } from './voting-buttons';
import { formatHumanDate } from '@/lib/date-utils';
import { componentStyles, sharedStyles } from '@/lib/utils';

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

  const score = upvotes - downvotes;

  return (
    <Card className={`${componentStyles.card} group relative overflow-hidden`}>
      <CardHeader className="pb-2 relative z-10">
        <div className="flex items-center justify-between">
          <Link
            href={`/image/${id}`}
            className="text-lg font-semibold transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text hover:text-transparent"
          >
            {title}
          </Link>
          <ScoreDisplay score={score} size="sm" />
        </div>
        {description && (
          <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">{description}</p>
        )}
      </CardHeader>

      <CardContent className="p-0 relative">
        <Link href={`/image/${id}`}>
          <div className="relative aspect-video w-full overflow-hidden group/image">
            <Image
              src={url}
              alt={title}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
            />
            {/* Hover overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          </div>
        </Link>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 pt-4 relative z-10">
        <div className="flex w-full items-center justify-between">
          <VotingButtons
            imageId={id}
            initialUpvotes={upvotes}
            initialDownvotes={downvotes}
            initialUserVote={userVote}
            layout="horizontal"
            size="sm"
          />

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild className="hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:text-purple-600 transition-all duration-300 hover:scale-105 group/comment">
              <Link href={`/image/${id}`}>
                <MessageCircle className="mr-1 h-4 w-4 group-hover/comment:animate-bounce" />
                {commentCount}
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex w-full items-center justify-between text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-300">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{formatHumanDate(createdAt)}</span>
          </div>
          <span className="font-medium bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text group-hover:text-transparent transition-all duration-300">by {uploadedBy.name}</span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                size="sm"
                href={`/tag/${tag.name}`}
                className={`hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 hover:text-purple-600 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 animate-fade-in hover:shadow-lg`}
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardFooter>
      
      {/* Card border glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
    </Card>
  );
}
