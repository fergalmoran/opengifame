'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  content: string;
  authorName: string | null;
  authorEmail: string;
  createdAt: string;
  replies?: Comment[];
}

interface CommentsProps {
  imageId: string;
  initialComments: Comment[];
}

export function Comments({ imageId, initialComments }: CommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const addedComment = await response.json();
        setComments([addedComment, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Use a consistent format that works on both server and client
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC', // Force UTC to ensure consistency
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
        
        {/* Add Comment Form - Only for authenticated users */}
        {session ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !newComment.trim()}
                  className="w-full"
                >
                  {isSubmitting ? 'Adding...' : 'Add Comment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                Please sign in to add a comment
              </p>
            </CardContent>
          </Card>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  No comments yet. Be the first to comment!
                </p>
              </CardContent>
            </Card>
          ) : (
            comments.map((comment) => (
              <Card key={comment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {comment.authorName || 'Anonymous'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{comment.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
