'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {Pencil, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EditImageDialogProps {
  imageId: string;
  imageOwnerId: string;
  initialTitle: string;
  initialDescription: string;
  initialTags: string[];
}

export function EditImageDialog({
                                  imageId,
                                  imageOwnerId,
                                  initialTitle,
                                  initialDescription,
                                  initialTags,
                                }: EditImageDialogProps) {
  const {data: session} = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = session?.user?.id === imageOwnerId;
  if (!isOwner) return null;

  // Reset the form to the latest server values whenever the dialog opens.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setTags(initialTags);
      setTagInput('');
      setError(null);
    }
    setOpen(next);
  };

  const addTag = (tagText: string) => {
    const trimmed = tagText.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/images/update', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          imageId,
          title: title.trim(),
          description: description.trim(),
          tags,
        }),
      });

      if (response.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error updating image:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Edit image">
          <Pencil className="h-4 w-4"/>
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit image</DialogTitle>
          <DialogDescription>
            Update the title, description, and tags for this image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter image title"
            />
          </div>

          <div>
            <label
              htmlFor="edit-description"
              className="block text-sm font-medium mb-2"
            >
              Description
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter image description (optional)"
              className="w-full p-3 border border-input rounded-md bg-background"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="edit-tags" className="block text-sm font-medium mb-2">
              Tags
            </label>
            <div className="space-y-2">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        aria-label={`Remove tag ${tag}`}
                        className="inline-flex items-center justify-center rounded-full hover:text-foreground"
                      >
                        <X className="h-3 w-3"/>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                id="edit-tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Type a tag and press Enter"
              />
              <p className="text-sm text-muted-foreground">
                Press Enter to add tags. Use backspace to remove the last tag.
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
