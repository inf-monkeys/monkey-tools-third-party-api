import axios from 'axios';
import crypto from 'crypto';

// 签名函数
function sha256Hex(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function hmacSHA256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function toUTCString(date: Date): string {
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

function buildCanonicalQueryString(query?: Record<string, string>) {
  if (!query) return '';
  const entries = Object.entries(query).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return entries.map(([k, v]) => `${encodeRFC3986(k)}=${encodeRFC3986(v)}`).join('&');
}

function volcSign(params: {
  method: string;
  host: string;
  path: string;
  query: Record<string, string>;
  body: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
}) {
  const method = params.method.toUpperCase();
  const host = params.host;
  const path = params.path || '/';
  const xDate = toUTCString(new Date());
  const date = xDate.slice(0, 8);

  const contentType = 'application/json';
  const payloadHash = sha256Hex(params.body || '');

  const allHeaders: Record<string, string> = {
    host,
    'content-type': contentType,
    'x-content-sha256': payloadHash,
    'x-date': xDate,
  };

  const signedHeaderKeys = Object.keys(allHeaders).sort();
  const canonicalHeaders = signedHeaderKeys.map((k) => `${k}:${allHeaders[k].trim()}`).join('\n');
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

  return {
    Host: host,
    'Content-Type': contentType,
    'X-Content-Sha256': payloadHash,
    'X-Date': xDate,
    Authorization: authorization,
  };
}

// 测试即梦 v4 API
async function testJimengV4() {
  const ak = process.env.VOLC_ACCESS_KEY_ID || '';
  const sk = process.env.VOLC_SECRET_ACCESS_KEY || '';
  const host = 'visual.volcengineapi.com';
  const version = '2022-08-31';
  const action = 'CVSync2AsyncSubmitTask';

  const body = JSON.stringify({
    req_key: 'jimeng_t2i_v40',
    prompt: '星际穿越，黑洞，黑洞里冲出一辆快支离破碎的复古列车',
    scale: 0.5,
  });

  const headers = volcSign({
    method: 'POST',
    host,
    path: '/',
    query: {
      Action: action,
      Version: version,
    },
    body,
    accessKeyId: ak,
    secretAccessKey: sk,
    region: 'cn-north-1',
    service: 'cv',
  });

  const url = `https://${host}/?Action=${encodeURIComponent(action)}&Version=${encodeURIComponent(version)}`;

  try {
    console.log('发送请求到:', url);
    console.log('请求体:', body);

    const response = await axios.post(url, body, { headers });

    console.log('\n✅ 成功！响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.log('\n❌ 失败！');
    if (error.response) {
      console.log('状态码:', error.response.status);
      console.log('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('错误信息:', error.message);
    }
  }
}

testJimengV4();
