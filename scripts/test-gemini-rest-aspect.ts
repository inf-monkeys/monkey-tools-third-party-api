import axios from 'axios';

function readPngDims(buf: Buffer) {
  if (buf.length < 24) return null as any;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < sig.length; i++)
    if (buf[i] !== sig[i]) return null as any;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

function readJpegDims(buf: Buffer) {
  if (buf.length < 4) return null as any;
  if (!(buf[0] === 0xff && buf[1] === 0xd8)) return null as any;
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
  return null as any;
}

async function main() {
  const apiKey = process.argv[2];
  const aspect = process.argv[3] || '16:9';
  const model = process.argv[4] || 'gemini-2.5-flash-image';
  if (!apiKey) {
    console.error(
      'Usage: ts-node scripts/test-gemini-rest-aspect.ts <API_KEY> <ASPECT_RATIO> [model]',
    );
    process.exit(1);
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: 'A minimalist ceramic mug on a concrete surface, studio lighting.',
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['Image'],
      imageConfig: {
        aspectRatio: aspect,
      },
    },
  };
  const resp = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = resp.data;
  const candidates = data.candidates || [];
  for (const cand of candidates) {
    const parts = (cand.content && cand.content.parts) || [];
    for (const part of parts) {
      if (part.inlineData) {
        const mime = part.inlineData.mimeType || 'image/png';
        const buf = Buffer.from(part.inlineData.data, 'base64');
        let dims: any = null;
        if (mime.includes('png')) dims = readPngDims(buf);
        if (!dims && (mime.includes('jpeg') || mime.includes('jpg')))
          dims = readJpegDims(buf);
        console.log('Aspect:', aspect, 'Mime:', mime, 'Dims:', dims);
      }
    }
  }
}

main().catch((e) => {
  console.error('Error:', e.response?.data || e.message);
  process.exit(1);
});
