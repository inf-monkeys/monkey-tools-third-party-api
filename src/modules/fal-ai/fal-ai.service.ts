import { config } from '@/common/config';
import { createFalClient } from '@fal-ai/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FalAiService {
  constructor() {}

  async subscribe(endpoint: string, input: any, apiKey?: string) {
    const client = createFalClient({
      credentials: apiKey || config.fal.apiKey,
      proxyUrl: config.proxy.url,
    });
    const result = await client.subscribe(endpoint, {
      input,
      logs: true,
    });
    return result;
  }
}
