import { GoogleGenAI } from '@google/genai';

// Quick direct test for aspect ratio using @google/genai
// Usage: ts-node scripts/test-gemini-aspect.ts <API_KEY> <ASPECT_RATIO> [model=gemini-2.5-flash-image] [noResp=false]

function readPngDims(buf: Buffer) {
  if (buf.length < 24) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++) if (buf[i] !== sig[i]) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

function readJpegDims(buf: Buffer) {
  if (buf.length < 4) return null;
  if (!(buf[0] === 0xff && buf[1] === 0xd8)) return null;
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    let marker = buf[offset + 1];
    while (marker === 0xff) {
      offset++;
      marker = buf[offset + 1];
    }
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buf.readUInt16BE(offset + 2);
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

async function main() {
  const apiKey = process.argv[2];
  const aspect = process.argv[3] || '16:9';
  const model = process.argv[4] || 'gemini-2.5-flash-image';
  const noResp = (process.argv[5] || 'false') === 'true';
  if (!apiKey) {
    console.error(
      'Usage: ts-node scripts/test-gemini-aspect.ts <API_KEY> <ASPECT_RATIO>',
    );
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });
  const prompt =
    'A minimalist ceramic mug on a concrete surface, studio lighting.';

  const config: any = { imageConfig: { aspectRatio: aspect } };
  if (!noResp) config.responseModalities = ['Image'];
  const resp = await client.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  if (!(resp.candidates && resp.candidates.length)) {
    console.log('No candidates. Full response:', JSON.stringify(resp, null, 2));
    return;
  }

  for (const cand of resp.candidates) {
    for (const part of cand.content?.parts || []) {
      if (part.inlineData) {
        const mime = part.inlineData.mimeType || 'image/png';
        const buf = Buffer.from(part.inlineData.data, 'base64');
        let dims = null as null | { width: number; height: number };
        if (mime.includes('png')) dims = readPngDims(buf);
        if (!dims && (mime.includes('jpeg') || mime.includes('jpg')))
          dims = readJpegDims(buf);
        console.log('Aspect:', aspect, 'Mime:', mime, 'Dims:', dims);
      } else if (part.text) {
        console.log('Text part:', part.text.slice(0, 80));
      }
    }
  }
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
