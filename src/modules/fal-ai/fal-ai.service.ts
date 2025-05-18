import { config } from '@/common/config';
import { FalAiRequestDto } from '@/common/schemas/fal-ai';
import { createFalClient } from '@fal-ai/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FalAiService {
  constructor() {}

  async subscribe(inputData: FalAiRequestDto) {
    const {
      endpoint,
      input,
      credential,
    } = inputData;
    let apiKey = '';
    if (credential) {
      const credentialData = JSON.parse(credential.encryptedData);
      apiKey = credentialData.api_key;
    } else {
      if (!config.fal.apiKey) {
        throw new Error('没有配置 Fal AI 的 API Key，请联系管理员。');
      }
      apiKey = config.fal.apiKey;
    }
    const client = createFalClient({
      credentials: apiKey,
      proxyUrl: config.proxy.url,
    });
    const result = await client.subscribe(endpoint, {
      input,
      logs: true,
    });
    return result;
  }
}
