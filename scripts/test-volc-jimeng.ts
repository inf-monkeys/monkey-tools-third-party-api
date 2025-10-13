import { JimengV4Service } from '@/modules/jimeng/jimeng.v4.service';

async function main() {
  const service = new JimengV4Service();
  // Support combined AK+SK input, fallback to defaults for local quick tests
  const combined = process.env.VOLC_COMBINED || '';
  let ak = process.env.VOLC_ACCESS_KEY_ID || '';
  let skRawBase64Twice = process.env.VOLC_SECRET_ACCESS_KEY_BASE64 || '';
  if (combined) {
    // Heuristic: AK often starts with AKL.. and is not base64 padded; tail likely base64 and ends with '=' padding
    // Try fixed split at 47 (observed in provided sample), else fallback to last '=' padding window
    const tryIdx = [47, combined.length - 60, combined.indexOf('Tj'), combined.indexOf('==') - 58].filter((v) => v > 8 && v < combined.length - 8);
    let chosenIdx = tryIdx[0];
    let best = null as null | { idx: number; score: number };
    for (const idx of tryIdx) {
      const tail = combined.slice(idx);
      try {
        const b = Buffer.from(tail, 'base64');
        const score = (tail.endsWith('=') ? 1 : 0) + (b.length > 0 ? 1 : 0);
        if (!best || score > best.score) best = { idx, score };
      } catch {}
    }
    if (best) chosenIdx = best.idx;
    ak = combined.slice(0, chosenIdx);
    skRawBase64Twice = combined.slice(chosenIdx);
    console.log('Parsed AK length:', ak.length, 'SK(b64) length:', skRawBase64Twice.length);
  }

  const sk1 = Buffer.from(skRawBase64Twice, 'base64').toString('utf8').trim();
  let sk2 = '';
  try {
    sk2 = Buffer.from(sk1, 'base64').toString('utf8').trim();
  } catch {}

  const attempts = [
    { label: 'double-decoded', sk: sk2 || sk1 },
    { label: 'single-decoded', sk: sk1 },
    { label: 'raw', sk: skRawBase64Twice },
  ];

  let lastErr: any;
  for (const attempt of attempts) {
    try {
      console.log(`Attempting submit with SK (${attempt.label})...`);
      const res = await service.submitTask({
        prompt: 'test cat in space',
        scale: 0.5,
        forceSingle: true,
        credential: {
          // @ts-ignore
          encryptedData: JSON.stringify({
            access_key_id: ak,
            secret_access_key: attempt.sk,
          }),
        },
      } as any);
      console.log('Submit OK:', JSON.stringify(res.data));
      const taskId = res?.data?.data?.task_id;
      if (!taskId) {
        console.log('No task_id in response; full:', JSON.stringify(res.data));
      } else {
        console.log('task_id:', taskId);
      }
      return;
    } catch (e: any) {
      lastErr = e;
      console.error(`Attempt ${attempt.label} failed:`, e?.response?.status, e?.response?.data || e?.message);
    }
  }
  if (lastErr) throw lastErr;
}

main().catch((e) => {
  console.error('Fatal:', e?.response?.status, e?.response?.data || e);
  process.exit(1);
});
