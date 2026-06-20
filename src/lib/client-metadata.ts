import type {NextRequest} from 'next/server';

// Order matters — Edge and Opera both contain "Chrome", so check them first.
const UA_PATTERNS: [RegExp, string][] = [
  [/Edg\/(\d+)/,             'Edge'],
  [/OPR\/(\d+)/,             'Opera'],
  [/SamsungBrowser\/(\d+)/,  'Samsung Browser'],
  [/Firefox\/(\d+)/,         'Firefox'],
  [/Chrome\/(\d+)/,          'Chrome'],
  [/Version\/(\d+).*Safari/, 'Safari'],
  [/Trident\//,              'IE 11'],
];

export function parseUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  for (const [pattern, name] of UA_PATTERNS) {
    const m = ua.match(pattern);
    if (m) return m[1] ? `${name} ${m[1]}` : name;
  }
  return null;
}

export interface ClientMetadata {
  // IP / network
  ip: string | null;
  ipChain: string | null;          // full x-forwarded-for chain — reveals proxy hops
  realIp: string | null;
  cfConnectingIp: string | null;   // Cloudflare origin IP
  cfCountry: string | null;        // Cloudflare GeoIP country code
  cfRay: string | null;            // Cloudflare request ID

  // Browser identity
  userAgent: string | null;
  secChUa: string | null;              // structured UA brand list  e.g. "Chromium";v="124"
  secChUaMobile: string | null;        // "?0" or "?1"
  secChUaPlatform: string | null;      // "Windows", "macOS", "Android" …
  secChUaArch: string | null;          // "x86", "arm"
  secChUaBitness: string | null;       // "64"
  secChUaFullVersionList: string | null;
  secChUaModel: string | null;         // device model on mobile

  // Locale / language
  acceptLanguage: string | null;

  // Fetch context — tells you how the request was initiated
  secFetchSite: string | null;   // "same-origin" | "cross-site" | "none"
  secFetchMode: string | null;   // "cors" | "navigate" | "no-cors" | "same-origin"
  secFetchDest: string | null;   // "document" | "empty" | "image" …
  secFetchUser: string | null;   // "?1" when triggered by user gesture

  // Origin / referrer
  origin: string | null;
  referer: string | null;

  // Content negotiation
  accept: string | null;
  acceptEncoding: string | null;

  // Privacy / tracking signals
  dnt: string | null;              // Do Not Track: "1" | "0"
  gpc: string | null;              // Global Privacy Control: "1"

  // Protocol / proxy info
  xForwardedProto: string | null;
  xForwardedHost: string | null;
  xForwardedPort: string | null;

  // Misc
  connection: string | null;
  cacheControl: string | null;
  pragma: string | null;

  capturedAt: string;              // ISO timestamp of capture
}

export function extractClientMetadata(request: NextRequest): ClientMetadata {
  const h = (name: string) => request.headers.get(name);

  return {
    ip:               h('x-forwarded-for')?.split(',')[0].trim() ?? h('x-real-ip') ?? h('cf-connecting-ip'),
    ipChain:          h('x-forwarded-for'),
    realIp:           h('x-real-ip'),
    cfConnectingIp:   h('cf-connecting-ip'),
    cfCountry:        h('cf-ipcountry'),
    cfRay:            h('cf-ray'),

    userAgent:             h('user-agent'),
    secChUa:               h('sec-ch-ua'),
    secChUaMobile:         h('sec-ch-ua-mobile'),
    secChUaPlatform:       h('sec-ch-ua-platform'),
    secChUaArch:           h('sec-ch-ua-arch'),
    secChUaBitness:        h('sec-ch-ua-bitness'),
    secChUaFullVersionList: h('sec-ch-ua-full-version-list'),
    secChUaModel:          h('sec-ch-ua-model'),

    acceptLanguage: h('accept-language'),

    secFetchSite: h('sec-fetch-site'),
    secFetchMode: h('sec-fetch-mode'),
    secFetchDest: h('sec-fetch-dest'),
    secFetchUser: h('sec-fetch-user'),

    origin:  h('origin'),
    referer: h('referer'),

    accept:         h('accept'),
    acceptEncoding: h('accept-encoding'),

    dnt: h('dnt'),
    gpc: h('sec-gpc'),

    xForwardedProto: h('x-forwarded-proto'),
    xForwardedHost:  h('x-forwarded-host'),
    xForwardedPort:  h('x-forwarded-port'),

    connection:   h('connection'),
    cacheControl: h('cache-control'),
    pragma:       h('pragma'),

    capturedAt: new Date().toISOString(),
  };
}
