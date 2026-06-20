/**
 * Smoke test for content moderation API credentials.
 * Sends a safe test image to both providers and prints their verdicts.
 * Run with: bun run scripts/test-moderation.ts
 */

import {readFile} from 'fs/promises';
import {join} from 'path';

// Use the project's apple-touch-icon — a real PNG well above Azure's 50×50 minimum
const testImagePath = join(import.meta.dir, '..', 'public', 'apple-touch-icon.png');
const testImage = await readFile(testImagePath);

async function testGoogleVision() {
  const key = process.env.GOOGLE_VISION_API_KEY;
  if (!key) { console.error('❌ GOOGLE_VISION_API_KEY not set'); return; }

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      requests: [{
        image: {content: testImage.toString('base64')},
        features: [{type: 'SAFE_SEARCH_DETECTION'}],
      }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Google Vision HTTP ${res.status}:`, text);
    return;
  }

  const data = await res.json();
  const ss = data.responses?.[0]?.safeSearchAnnotation;
  console.log('✅ Google Vision SafeSearch:', ss);
}

async function testAzureContentSafety() {
  const endpoint = process.env.AZURE_CONTENT_SAFETY_ENDPOINT;
  const key = process.env.AZURE_CONTENT_SAFETY_KEY;
  if (!endpoint || !key) { console.error('❌ Azure Content Safety not configured'); return; }

  const res = await fetch(
    `${endpoint.replace(/\/$/, '')}/contentsafety/image:analyze?api-version=2024-09-01`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Ocp-Apim-Subscription-Key': key},
      body: JSON.stringify({
        image: {content: testImage.toString('base64')},
        categories: ['Sexual', 'Violence', 'Hate', 'SelfHarm'],
        outputType: 'FourSeverityLevels',
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Azure Content Safety HTTP ${res.status}:`, text);
    return;
  }

  const data = await res.json();
  console.log('✅ Azure Content Safety:', data.categoriesAnalysis);
}

console.log(`Testing content moderation providers with ${testImagePath}...\n`);
await Promise.all([testGoogleVision(), testAzureContentSafety()]);
