'use client';
import {Card, CardContent, CardFooter, CardHeader} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {ScoreDisplay} from '@/components/ui/stats-display';
import {Calendar, MessageCircle} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {VotingButtons} from './voting-buttons';
import {ReportImageButton} from './report-image-button';
import {formatHumanDate} from '@/lib/date-utils';

interface ImageCardProps {
  id: string;
  slug: string;
  title: string;
  description?: string;
  url: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  uploadedBy: {
    id?: string;
    slug?: string;
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
                            slug,
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
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Link
            href={`/image/${slug}`}
            className="text-lg font-semibold hover:text-primary transition-colors"
          >
            {title}
          </Link>
          <ScoreDisplay score={score} size="sm"/>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Link href={`/image/${slug}`}>
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={url}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 pt-4">
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
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/image/${slug}`}>
                <MessageCircle className="mr-1 h-4 w-4"/>
                {commentCount}
              </Link>
            </Button>
            <ReportImageButton imageId={id}/>
          </div>
        </div>

        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3"/>
            <span>{formatHumanDate(createdAt)}</span>
          </div>
          {(uploadedBy.slug ?? uploadedBy.id) ? (
            <Link
              href={`/@${uploadedBy.slug ?? uploadedBy.id}`}
              className="font-medium hover:text-primary transition-colors"
            >
              by {uploadedBy.name}
            </Link>
          ) : (
            <span className="font-medium">by {uploadedBy.name}</span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" asChild>
                <Link href={`/tag/${tag.name}`}>#{tag.name}</Link>
              </Badge>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
