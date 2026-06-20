'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateModerationThreshold } from '@/app/admin/actions';
import type { AzureThreshold, ModerationThresholds } from '@/lib/site-settings';

type ThresholdValue = AzureThreshold | 'allow';

const THRESHOLD_OPTIONS: { value: ThresholdValue; label: string; description: string }[] = [
  { value: 'allow', label: 'Allow all', description: 'No restriction' },
  { value: 6, label: 'Block high', description: 'Extreme content only' },
  { value: 4, label: 'Block medium+', description: 'Explicit and above' },
  { value: 2, label: 'Block low+', description: 'Suggestive and above' },
  { value: 0, label: 'Block all', description: 'Any detection' },
];

const CATEGORIES: { key: keyof ModerationThresholds; label: string; description: string }[] = [
  { key: 'Sexual', label: 'Sexual content', description: 'Adult or explicit imagery.' },
  { key: 'Violence', label: 'Violence / gore', description: 'Graphic violence or disturbing imagery.' },
  { key: 'Hate', label: 'Hate content', description: 'Content targeting groups by identity.' },
  { key: 'SelfHarm', label: 'Self-harm', description: 'Content depicting or promoting self-harm.' },
];

function ThresholdRow({
  category,
  current,
}: {
  category: (typeof CATEGORIES)[number];
  current: ThresholdValue;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(value: ThresholdValue) {
    startTransition(async () => {
      await updateModerationThreshold(category.key, value);
      router.refresh();
    });
  }

  return (
    <div className={`rounded-lg border p-4 space-y-3 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <div>
        <div className="font-medium text-sm">{category.label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{category.description}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {THRESHOLD_OPTIONS.map(opt => {
          const active = current === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={isPending}
              onClick={() => handleChange(opt.value)}
              title={opt.description}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsTab({ thresholds }: { thresholds: ModerationThresholds }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-base font-semibold"></h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure automatic content blocking.
          <br /><span className="text-muted italic">CSAM is always blocked, and will instantly trigger a report to the authorities.</span>
        </p>
      </div>
      <div className="space-y-3">
        {CATEGORIES.map(cat => (
          <ThresholdRow key={cat.key} category={cat} current={thresholds[cat.key]} />
        ))}
      </div>
    </div>
  );
}
