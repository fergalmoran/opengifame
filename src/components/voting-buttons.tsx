'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface VotingButtonsProps {
  imageId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote?: 'up' | 'down' | null;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export function VotingButtons({ 
  imageId, 
  initialUpvotes, 
  initialDownvotes, 
  initialUserVote = null,
  layout = 'horizontal',
  size = 'sm'
}: VotingButtonsProps) {
  const { data: session } = useSession();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const [voteAnimation, setVoteAnimation] = useState<'up' | 'down' | null>(null);

  const handleVote = async (isUpvote: boolean) => {
    if (!session?.user?.id || isVoting) return;

    setIsVoting(true);
    setVoteAnimation(isUpvote ? 'up' : 'down');
    
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
      setTimeout(() => setVoteAnimation(null), 300);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'lg': return 'default';
      case 'md': return 'sm';
      case 'sm': 
      default: return 'sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'lg': return 'h-5 w-5';
      case 'md': return 'h-4 w-4';
      case 'sm': 
      default: return 'h-4 w-4';
    }
  };

  if (!session) {
    const containerClass = layout === 'vertical' 
      ? 'flex flex-col items-center space-y-2' 
      : 'flex items-center space-x-2';
      
    return (
      <div className={`${containerClass} text-sm text-muted-foreground`}>
        <div className="flex items-center space-x-1 px-3 py-2 rounded-full bg-muted/50 backdrop-blur-sm">
          <ArrowUp className="h-3 w-3 text-green-600" />
          <span className="text-xs font-medium">{upvotes}</span>
        </div>
        <div className="flex items-center space-x-1 px-3 py-2 rounded-full bg-muted/50 backdrop-blur-sm">
          <ArrowDown className="h-3 w-3 text-red-600" />
          <span className="text-xs font-medium">{downvotes}</span>
        </div>
        {layout === 'vertical' && (
          <span className="text-xs text-center opacity-75">(Sign in to vote)</span>
        )}
      </div>
    );
  }

  const containerClass = layout === 'vertical' 
    ? 'flex flex-col items-center space-y-2' 
    : 'flex items-center space-x-2';

  return (
    <div className={containerClass}>
      <Button
        variant={userVote === 'up' ? 'default' : 'outline'}
        size={getButtonSize()}
        onClick={() => handleVote(true)}
        disabled={isVoting}
        className={`hover-lift transition-all duration-200 relative overflow-hidden ${
          userVote === 'up' 
            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white neon-glow border-0' 
            : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-900/30 neon-border'
        } ${voteAnimation === 'up' ? 'animate-pulse scale-110' : ''}`}
      >
        {voteAnimation === 'up' && (
          <div className="absolute inset-0 bg-green-400/30 animate-ping rounded" />
        )}
        <ArrowUp className={`${getIconSize()} mr-1 relative z-10`} />
        <span className="relative z-10">{upvotes}</span>
      </Button>
      
      <Button
        variant={userVote === 'down' ? 'default' : 'outline'}
        size={getButtonSize()}
        onClick={() => handleVote(false)}
        disabled={isVoting}
        className={`hover-lift transition-all duration-200 relative overflow-hidden ${
          userVote === 'down' 
            ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white neon-glow border-0' 
            : 'hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/30 neon-border'
        } ${voteAnimation === 'down' ? 'animate-pulse scale-110' : ''}`}
      >
        {voteAnimation === 'down' && (
          <div className="absolute inset-0 bg-red-400/30 animate-ping rounded" />
        )}
        <ArrowDown className={`${getIconSize()} mr-1 relative z-10`} />
        <span className="relative z-10">{downvotes}</span>
      </Button>
    </div>
  );
}
