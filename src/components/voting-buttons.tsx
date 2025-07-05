'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface VotingButtonsProps {
  imageId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote?: 'up' | 'down' | null;
}

export function VotingButtons({ 
  imageId, 
  initialUpvotes, 
  initialDownvotes, 
  initialUserVote = null 
}: VotingButtonsProps) {
  const { data: session } = useSession();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (isUpvote: boolean) => {
    if (!session?.user?.id || isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch('/api/images/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          isUpvote,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setUpvotes(result.upvotes);
        setDownvotes(result.downvotes);
        setUserVote(result.userVote);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center space-y-2 text-sm text-muted-foreground">
        <div className="flex flex-col items-center space-y-1">
          <span className="text-lg">👍</span>
          <span className="text-xs">{upvotes}</span>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <span className="text-lg">👎</span>
          <span className="text-xs">{downvotes}</span>
        </div>
        <span className="text-xs text-center">(Sign in to vote)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        variant={userVote === 'up' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote(true)}
        disabled={isVoting}
        className="flex flex-col items-center space-y-1 h-auto py-2 px-3 cursor-pointer hover:scale-105 transition-transform"
      >
        <span className="text-lg">👍</span>
        <span className="text-xs">{upvotes}</span>
      </Button>
      
      <Button
        variant={userVote === 'down' ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleVote(false)}
        disabled={isVoting}
        className="flex flex-col items-center space-y-1 h-auto py-2 px-3 cursor-pointer hover:scale-105 transition-transform"
      >
        <span className="text-lg">👎</span>
        <span className="text-xs">{downvotes}</span>
      </Button>
    </div>
  );
}
