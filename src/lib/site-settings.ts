import {db} from '@/lib/db';
import {siteSettings} from '@/lib/db/schema';
import {env} from '@/env';
import {inArray} from 'drizzle-orm';

export type AzureThreshold = 0 | 2 | 4 | 6;

export interface ModerationThresholds {
  Sexual:   AzureThreshold | 'allow';
  Violence: AzureThreshold | 'allow';
  Hate:     AzureThreshold | 'allow';
  SelfHarm: AzureThreshold | 'allow';
}

const MODERATION_KEYS = [
  'moderation.sexual',
  'moderation.violence',
  'moderation.hate',
  'moderation.selfharm',
] as const;

type ModerationKey = (typeof MODERATION_KEYS)[number];

function parseThreshold(raw: string | undefined, envFallback: number): AzureThreshold | 'allow' {
  if (raw === 'allow') return 'allow';
  const n = Number(raw);
  if ([0, 2, 4, 6].includes(n)) return n as AzureThreshold;
  return envFallback as AzureThreshold;
}

export async function getModerationThresholds(): Promise<ModerationThresholds> {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, [...MODERATION_KEYS]));

  const byKey = Object.fromEntries(rows.map(r => [r.key, r.value])) as Partial<Record<ModerationKey, string>>;

  return {
    Sexual:   parseThreshold(byKey['moderation.sexual'],   env.MODERATION_THRESHOLD_SEXUAL),
    Violence: parseThreshold(byKey['moderation.violence'], env.MODERATION_THRESHOLD_VIOLENCE),
    Hate:     parseThreshold(byKey['moderation.hate'],     env.MODERATION_THRESHOLD_HATE),
    SelfHarm: parseThreshold(byKey['moderation.selfharm'], env.MODERATION_THRESHOLD_SELFHARM),
  };
}

export async function setModerationThreshold(
  category: keyof ModerationThresholds,
  value: AzureThreshold | 'allow',
) {
  const key: ModerationKey = `moderation.${category.toLowerCase()}` as ModerationKey;
  await db
    .insert(siteSettings)
    .values({key, value: String(value)})
    .onConflictDoUpdate({target: siteSettings.key, set: {value: String(value), updatedAt: new Date()}});
}
