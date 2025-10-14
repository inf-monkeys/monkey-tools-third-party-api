import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { config } from '@/common/config';
import { processContentUrls } from '@/common/utils/output';

export interface JimengArkGenerateInput {
  prompt?: string;
  image?: string | string[];
  size?: '1K' | '2K' | '4K';
  seed?: number;
  sequential_image_generation?: 'auto' | 'disabled';
  sequential_image_generation_options?: {
    max_images?: number;
  };
  guidance_scale?: number;
  response_format?: 'url' | 'b64_json';
  watermark?: boolean;
  stream?: boolean;
  credential?: {
    encryptedData?: string;
  } | null;
}

@Injectable()
export class JimengArkService {
  private readonly endpoint =
    'https://ark.cn-beijing.volces.com/api/v3/images/generations';
  private readonly model = 'doubao-seedream-4-0-250828';

  private getApiKeyFromCredential(
    credential?: {
      encryptedData?: string;
    } | null,
  ): string | null {
    if (!credential) return null;
    try {
      const data = JSON.parse(credential.encryptedData || '{}');
      const apiKey = data.api_key || data.apiKey || data.key;
      if (apiKey) return apiKey;
    } catch {}
    return null;
  }

  private resolveApiKey(
    inputCredential?: { encryptedData?: string } | null,
  ): string {
    const fromInput = this.getApiKeyFromCredential(inputCredential);
    if (fromInput) return fromInput;

    const apiKey = config.byteArk?.apiKey;
    if (!apiKey) {
      throw new Error('未配置豆包 Ark API Key，请在凭证或配置中提供。');
    }
    return apiKey;
  }

  async generate(input: JimengArkGenerateInput) {
    if (!input.prompt) {
      throw new Error('prompt 为必填字段');
    }

    const apiKey = this.resolveApiKey(input.credential);

    const body: any = {
      model: this.model,
      prompt: input.prompt,
      size: input.size || '2K',
      sequential_image_generation:
        input.sequential_image_generation || 'disabled',
      response_format: input.response_format || 'url',
      stream: input.stream ?? false,
      watermark: input.watermark ?? true,
    };

    // 添加可选参数
    if (input.image !== undefined) {
      body.image = input.image;
    }

    if (input.seed !== undefined && input.seed !== -1) {
      body.seed = input.seed;
    }

    if (
      input.sequential_image_generation === 'auto' &&
      input.sequential_image_generation_options
    ) {
      body.sequential_image_generation_options =
        input.sequential_image_generation_options;
    }

    if (input.guidance_scale !== undefined) {
      body.guidance_scale = input.guidance_scale;
    }

    try {
      const response = await axios.post(this.endpoint, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        proxy: config.proxy?.url
          ? {
              host: new URL(config.proxy.url).hostname,
              port: parseInt(new URL(config.proxy.url).port),
              protocol: new URL(config.proxy.url).protocol.slice(0, -1),
            }
          : undefined,
      });

      const output = await processContentUrls(response.data);

      return {
        data: output,
        requestId: response.headers['x-request-id'] || '',
      };
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `豆包 Ark API 调用失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }
}
