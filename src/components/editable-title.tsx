'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';

interface EditableTitleProps {
  imageId: string;
  initialTitle: string;
  imageOwnerId: string;
}

export function EditableTitle({ imageId, initialTitle, imageOwnerId }: EditableTitleProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState(initialTitle || 'Untitled');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwner = session?.user?.id === imageOwnerId;

  const handleDoubleClick = () => {
    if (!isOwner) return;
    setIsEditing(true);
    setEditValue(title);
  };

  const handleSave = async () => {
    if (!editValue.trim() || editValue === title) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch('/api/images/update-title', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          title: editValue.trim(),
        }),
      });

      if (response.ok) {
        setTitle(editValue.trim());
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating title:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isUpdating}
        autoFocus
        className="text-2xl font-bold"
        placeholder="Enter title..."
      />
    );
  }

  return (
    <h1
      className={`text-2xl font-bold ${
        isOwner 
          ? 'cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors' 
          : ''
      }`}
      onDoubleClick={handleDoubleClick}
      title={isOwner ? 'Double-click to edit title' : undefined}
    >
      {title}
    </h1>
  );
}
