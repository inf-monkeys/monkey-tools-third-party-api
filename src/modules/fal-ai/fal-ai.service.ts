import { config } from '@/common/config';
import { createFalClient } from '@fal-ai/client';
import { Injectable } from '@nestjs/common';


@Injectable()
export class FalAiService {
  constructor() { }

  async subscribe(endpoint: string, input: any, apiKey?: string) {
    const client = createFalClient({
      credentials: apiKey || config.fal.apiKey,
      proxyUrl: config.proxy.url,
    });
    await client.subscribe(endpoint, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });
  }

}
