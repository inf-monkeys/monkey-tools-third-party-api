import { Injectable, Logger } from '@nestjs/common';
import { config } from '@/common/config';
import axios from 'axios';
import { ByteArkImageEditRequestDto } from '@/common/schemas/byte-ark';
import { processContentUrls } from '@/common/utils/output';

@Injectable()
export class ByteArkService {
  private readonly logger = new Logger(ByteArkService.name);
  private readonly baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
  private readonly apiKey: string = config.byteArk?.apiKey || '';

  constructor() {}

  /**
   * 从凭证对象中获取API密钥
   * @param credential 凭证对象
   * @returns API密钥
   */
  private getApiKey(credential?: any): string {
    if (credential) {
      // 直接检查credential对象中是否有apiKey
      if (credential.apiKey) {
        return credential.apiKey;
      }

      // 尝试使用encryptedData作为API密钥（如果存在）
      if (credential.encryptedData) {
        try {
          // 首先尝试解析为JSON
          try {
            const credentialData = JSON.parse(credential.encryptedData);
            if (credentialData.api_key) {
              return credentialData.api_key;
            }
          } catch (jsonError) {
            // 如果不是有效的JSON，则直接使用encryptedData作为API密钥
            return credential.encryptedData;
          }
        } catch (error) {
          this.logger.error('处理凭证数据失败:', error.message);
        }
      }
    }

    // 如果凭证中没有API密钥或处理失败，则使用配置中的API密钥
    if (!this.apiKey) {
      throw new Error('没有配置字节 ARK API Key，请联系管理员。');
    }
    return this.apiKey;
  }

  /**
   * 编辑图像或生成图像
   * @param inputData 请求参数，包含inputs对象
   * @returns 生成或编辑后的图像数据
   */
  async editImage(inputData: ByteArkImageEditRequestDto) {
    try {
      // 获取API密钥
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      // 直接使用用户提供的inputs对象作为请求体
      const payload = { ...inputData.inputs };

      this.logger.log('Sending request to ByteArk API');

      // 打印完整的请求信息
      console.log('ByteArk API URL:', `${this.baseUrl}/images/generations`);
      console.log('ByteArk API Request Headers:', {
        Authorization: `Bearer ${apiKey.substring(0, 10)}...`,
        'Content-Type': 'application/json',
      });
      console.log(
        'ByteArk API Request Payload:',
        JSON.stringify(payload, null, 2),
      );

      // 发送API请求
      const response = await axios.post(
        `${this.baseUrl}/images/generations`,
        payload,
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

      // 打印响应信息
      console.log('ByteArk API Response Status:', response.status);
      console.log('ByteArk API Response Headers:', response.headers);
      console.log(
        'ByteArk API Response Data:',
        JSON.stringify(response.data, null, 2),
      );

      const output = await processContentUrls(response.data);

      return {
        data: output,
        requestId: response.headers['x-request-id'] || '',
      };
    } catch (error) {
      this.logger.error(`ByteArk API request failed: ${error.message}`);
      throw error;
    }
  }
}
