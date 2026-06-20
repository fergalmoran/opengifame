'use client';

import {useState} from 'react';
import {Flag} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const REASONS = [
  {value: 'csam',            label: 'Child sexual abuse material (CSAM)'},
  {value: 'non_consensual',  label: 'Non-consensual intimate imagery'},
  {value: 'violence',        label: 'Violence or gore'},
  {value: 'spam',            label: 'Spam or misleading content'},
  {value: 'other',           label: 'Other'},
] as const;

type Reason = (typeof REASONS)[number]['value'];

export function ReportImageButton({imageId}: {imageId: string}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      await fetch('/api/images/report', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({imageId, reason, details}),
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        setReason(null);
        setDetails('');
        setDone(false);
      }, 200);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-muted-foreground hover:text-destructive hover:border-destructive">
          <Flag className="h-4 w-4 mr-1.5"/>
          Report
        </Button>
      </DialogTrigger>

      <DialogContent>
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle>Report submitted</DialogTitle>
              <DialogDescription>
                Thank you — our moderation team will review this image shortly.
                If this involves illegal content, do not hesitate to also contact your local authorities.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Report this image</DialogTitle>
              <DialogDescription>
                Select the reason that best describes the problem. Reports are anonymous.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                    reason === r.value
                      ? 'border-destructive bg-destructive/10 text-destructive font-medium'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className="w-full p-3 border border-input rounded-md bg-background text-sm resize-none"
            />

            <DialogFooter showCloseButton>
              <Button
                variant="destructive"
                disabled={!reason || submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting…' : 'Submit report'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
