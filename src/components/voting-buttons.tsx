'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {useSession} from 'next-auth/react';
import {ArrowDown, ArrowUp} from 'lucide-react';

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
  const {data: session} = useSession();
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

  const getButtonSize = () => {
    switch (size) {
      case 'lg':
        return 'default';
      case 'md':
        return 'sm';
      case 'sm':
      default:
        return 'sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'lg':
        return 'h-5 w-5';
      case 'md':
        return 'h-4 w-4';
      case 'sm':
      default:
        return 'h-4 w-4';
    }
  };

  if (!session) {
    const containerClass = layout === 'vertical'
      ? 'flex flex-col items-center space-y-2'
      : 'flex items-center space-x-2';

    return (
      <div className={`${containerClass} text-sm text-muted-foreground`}>
        <div className="flex items-center space-x-1 px-3 py-2 rounded-full bg-muted/50">
          <ArrowUp className="h-3 w-3"/>
          <span className="text-xs font-medium">{upvotes}</span>
        </div>
        <div className="flex items-center space-x-1 px-3 py-2 rounded-full bg-muted/50">
          <ArrowDown className="h-3 w-3"/>
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
      >
        <ArrowUp className={`${getIconSize()} mr-1`}/>
        <span>{upvotes}</span>
      </Button>

      <Button
        variant={userVote === 'down' ? 'default' : 'outline'}
        size={getButtonSize()}
        onClick={() => handleVote(false)}
        disabled={isVoting}
      >
        <ArrowDown className={`${getIconSize()} mr-1`}/>
        <span>{downvotes}</span>
      </Button>
    </div>
  );
}
