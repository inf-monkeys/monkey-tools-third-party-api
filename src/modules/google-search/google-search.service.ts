import { Injectable, Logger } from '@nestjs/common';
import { config } from '@/common/config';
import axios from 'axios';
import { GoogleSearchRequestDto } from '@/common/schemas/google-search';
import { processContentUrls } from '@/common/utils/output';

@Injectable()
export class GoogleSearchService {
  private readonly logger = new Logger(GoogleSearchService.name);
  private readonly baseUrl = 'https://google.serper.dev';
  private readonly apiKey: string = config.googleSearch?.apiKey || '';

  constructor() {}

  private getApiKey(credential?: any): string {
    if (credential) {
      if (credential.apiKey) {
        return credential.apiKey;
      }

      if (credential.encryptedData) {
        try {
          try {
            const credentialData = JSON.parse(credential.encryptedData);
            if (credentialData.api_key) {
              return credentialData.api_key;
            }
          } catch (jsonError) {
            return credential.encryptedData;
          }
        } catch (error) {
          this.logger.error('处理凭证数据失败:', error.message);
        }
      }
    }

    if (!this.apiKey) {
      throw new Error('没有配置 Google Search API Key，请联系管理员。');
    }
    return this.apiKey;
  }

  async search(inputData: GoogleSearchRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const {
        q,
        gl = 'us',
        hl = 'en',
        type = 'search',
        num,
      } = inputData.inputs;

      const payload: any = {
        q,
        gl,
        hl,
      };

      if (num) {
        payload.num = num;
      }

      this.logger.log('Sending request to Google Search API via Serper');

      console.log('API URL:', `${this.baseUrl}/${type}`);
      console.log('API Request Headers:', {
        'X-API-KEY': `${apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json',
      });
      console.log('API Request Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(`${this.baseUrl}/${type}`, payload, {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
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
    } catch (error) {
      this.logger.error(`Google Search API request failed: ${error.message}`);
      throw error;
    }
  }
}
