import crypto from 'crypto';

export interface VolcSignParams {
  method: string; // 'POST' | 'GET'
  host: string; // e.g., 'visual.volcengineapi.com'
  path: string; // e.g., '/'
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string | number | undefined>;
  body: string; // JSON string body
  accessKeyId: string;
  secretAccessKey: string;
  region: string; // 'cn-north-1'
  service: string; // 'cv'
  xDate?: string; // 'YYYYMMDDTHHmmssZ'; if not provided, generate now
}

function sha256Hex(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmacSHA256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function toUTCString(date: Date): string {
  // Format: YYYYMMDDTHHmmssZ
  const YYYY = date.getUTCFullYear();
  const MM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(date.getUTCDate()).padStart(2, '0');
  const HH = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}T${HH}${mm}${ss}Z`;
}

function encodeRFC3986(str: string) {
  return encodeURIComponent(str).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildCanonicalQueryString(query?: Record<string, string | number | boolean | undefined>) {
  if (!query) return '';
  const entries = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)] as [string, string])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return entries.map(([k, v]) => `${encodeRFC3986(k)}=${encodeRFC3986(v)}`).join('&');
}

export function volcSign(params: VolcSignParams) {
  const method = params.method.toUpperCase();
  const host = params.host;
  const path = params.path || '/';
  const xDate = params.xDate || toUTCString(new Date());
  const date = xDate.slice(0, 8);

  const contentType = 'application/json';
  const payloadHash = sha256Hex(params.body || '');

  const baseHeaders: Record<string, string> = {
    host,
    'content-type': contentType,
    'x-content-sha256': payloadHash,
    'x-date': xDate,
  };

  // Merge any extra headers (lowercased)
  const extraHeaders: Record<string, string> = {};
  if (params.headers) {
    for (const [k, v] of Object.entries(params.headers)) {
      if (v !== undefined && v !== null) extraHeaders[k.toLowerCase()] = String(v);
    }
  }
  const allHeaders = { ...baseHeaders, ...extraHeaders };

  const signedHeaderKeys = Object.keys(allHeaders).sort();
  const canonicalHeaders = signedHeaderKeys.map((k) => `${k}:${allHeaders[k].toString().trim()}`).join('\n');
  const signedHeaders = signedHeaderKeys.join(';');

  const canonicalQueryString = buildCanonicalQueryString(params.query);
  const canonicalRequest = [
    method,
    path,
    canonicalQueryString,
    canonicalHeaders + '\n',
    signedHeaders,
    payloadHash,
  ].join('\n');

  const scope = `${date}/${params.region}/${params.service}/request`;
  const stringToSign = [
    'HMAC-SHA256',
    xDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmacSHA256(Buffer.from('VOLC' + params.secretAccessKey, 'utf-8'), date);
  const kRegion = hmacSHA256(kDate, params.region);
  const kService = hmacSHA256(kRegion, params.service);
  const kSigning = hmacSHA256(kService, 'request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization = `HMAC-SHA256 Credential=${params.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headersOut: Record<string, string> = {
    Host: host,
    'Content-Type': contentType,
    'X-Content-Sha256': payloadHash,
    'X-Date': xDate,
    Authorization: authorization,
  };
  // preserve any additional headers provided
  for (const k of Object.keys(extraHeaders)) {
    headersOut[k.replace(/^[a-z]/, (c) => c.toUpperCase())] = extraHeaders[k];
  }

  return {
    headers: headersOut,
    signedHeadersList: signedHeaderKeys,
    canonicalRequest,
    stringToSign,
    authorization,
    xDate,
  };
}

