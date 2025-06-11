import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { config } from '@/common/config';
import { JimengGenerateRequestDto } from '@/common/schemas/jimeng';
import { processContentUrls } from '@/common/utils/output';

@Injectable()
export class JimengService {
  private readonly baseUrl = 'https://jimeng-free-api-zi94.onrender.com/v1';
  private readonly defaultModel = 'jimeng-2.0pro';

  constructor() {}

  async generateImage(inputData: JimengGenerateRequestDto) {
    let apiKey = '';
    if (inputData.credential) {
      const credentialData = JSON.parse(inputData.credential.encryptedData);
      apiKey = credentialData.api_key;
    } else {
      if (!config.jimeng?.apiKey) {
        throw new Error('没有配置即梦 API Key，请联系管理员。');
      }
      apiKey = config.jimeng.apiKey;
    }

    const response = await axios.post(
      `${this.baseUrl}/images/generations`,
      {
        model: this.defaultModel,
        prompt: inputData.prompt,
        negativePrompt: inputData.negativePrompt || '',
        width: inputData.width || 1024,
        height: inputData.height || 1024,
        sample_strength: inputData.sampleStrength || 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        proxy: config.proxy?.url
          ? {
              host: new URL(config.proxy.url).hostname,
              port: parseInt(new URL(config.proxy.url).port),
              protocol: new URL(config.proxy.url).protocol.slice(0, -1),
            }
          : undefined,
      },
    );

    const output = await processContentUrls(response.data);

    return {
      data: output,
      requestId: response.headers['x-request-id'] || '',
    };
  }
}
