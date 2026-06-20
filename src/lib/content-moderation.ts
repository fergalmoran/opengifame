type Likelihood = 'UNKNOWN' | 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';

const BLOCKED_LIKELIHOODS = new Set<Likelihood>(['LIKELY', 'VERY_LIKELY']);

// Inline base64 size limits per provider
const GOOGLE_VISION_MAX_BYTES = 10 * 1024 * 1024;  // 10 MB
const AZURE_CONTENT_SAFETY_MAX_BYTES = 4 * 1024 * 1024;  // 4 MB

export interface ModerationResult {
  blocked: boolean;
  reason?: string;
}

async function checkGoogleVision(buffer: Buffer): Promise<ModerationResult | null> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: buffer.toString('base64') },
          features: [{ type: 'SAFE_SEARCH_DETECTION' }],
        }],
      }),
    }
  );

  if (!res.ok) throw new Error(`Google Vision HTTP ${res.status}`);

  const data = await res.json();
  const ss = data.responses?.[0]?.safeSearchAnnotation;
  if (!ss) return { blocked: false };

  if (BLOCKED_LIKELIHOODS.has(ss.adult) || BLOCKED_LIKELIHOODS.has(ss.violence)) {
    return { blocked: true, reason: `google:adult=${ss.adult},violence=${ss.violence}` };
  }
  return { blocked: false };
}

function getThresholds() {
  const parse = (env: string | undefined, fallback: number) => {
    const n = parseInt(env ?? '', 10);
    return [0, 2, 4, 6].includes(n) ? n : fallback;
  };
  return {
    Sexual:   parse(process.env.MODERATION_THRESHOLD_SEXUAL,   2),
    Violence: parse(process.env.MODERATION_THRESHOLD_VIOLENCE, 4),
    Hate:     parse(process.env.MODERATION_THRESHOLD_HATE,     4),
    SelfHarm: parse(process.env.MODERATION_THRESHOLD_SELFHARM, 4),
  };
}

async function checkAzureContentSafety(buffer: Buffer): Promise<ModerationResult> {
  const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT;
  const key = process.env.AZURE_CONTENT_SAFETY_KEY;
  if (!endpoint || !key) throw new Error('Azure Content Safety not configured');

  const thresholds = getThresholds();

  // Only request categories that aren't fully disabled (threshold > 6 would mean never block).
  const activeCategories = (Object.keys(thresholds) as Array<keyof typeof thresholds>)
    .filter(cat => thresholds[cat] <= 6);

  const res = await fetch(
    `${endpoint.replace(/\/$/, '')}/contentsafety/image:analyze?api-version=2024-09-01`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': key,
      },
      body: JSON.stringify({
        image: { content: buffer.toString('base64') },
        categories: activeCategories,
        outputType: 'FourSeverityLevels',
      }),
    }
  );

  if (!res.ok) throw new Error(`Azure Content Safety HTTP ${res.status}`);

  const data = await res.json();

  const flagged = (data.categoriesAnalysis as Array<{ category: string; severity: number }>)
    .filter(c => c.severity >= (thresholds[c.category as keyof typeof thresholds] ?? 4));

  if (flagged.length > 0) {
    return {
      blocked: true,
      reason: `azure:${flagged.map(c => `${c.category}=${c.severity}`).join(',')}`,
    };
  }
  return { blocked: false };
}

/**
 * Run image content moderation against Google Vision SafeSearch and Azure Content Safety.
 *
 * Fail-closed: if all available providers throw, the upload is rejected.
 * Videos are not checked here — frame-level video moderation is a TODO.
 */
export async function moderateContent(
  buffer: Buffer,
  mimeType: string,
): Promise<ModerationResult> {
  if (mimeType === 'video/mp4') {
    // TODO: extract a keyframe and check it
    return { blocked: false };
  }

  const checks: Promise<ModerationResult | null>[] = [];

  if (buffer.length <= GOOGLE_VISION_MAX_BYTES) {
    checks.push(checkGoogleVision(buffer));
  }
  if (buffer.length <= AZURE_CONTENT_SAFETY_MAX_BYTES) {
    checks.push(checkAzureContentSafety(buffer));
  }

  // Reject images that exceed both providers' inline size limits
  if (checks.length === 0) {
    return { blocked: true, reason: 'image-exceeds-moderation-size-limit' };
  }

  const results = await Promise.allSettled(checks);

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value?.blocked) {
      return result.value!;
    }
  }

  const allFailed = results.every(r => r.status === 'rejected');
  if (allFailed) {
    const errors = results.map(r => (r as PromiseRejectedResult).reason);
    console.error('[moderation] all providers failed — rejecting upload as a safety measure', errors);
    return { blocked: true, reason: 'moderation-unavailable' };
  }

  return { blocked: false };
}
