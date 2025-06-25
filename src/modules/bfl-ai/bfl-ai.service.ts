import { config } from '@/common/config';
import { BflAiRequestDto } from '@/common/schemas/bfl-ai';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { processContentUrls } from '@/common/utils/output';

@Injectable()
export class BflAiService {
  private readonly logger = new Logger(BflAiService.name);
  private readonly apiBaseUrl = 'https://api.bfl.ai/v1/flux-kontext-max';
  private readonly apiResultUrl = 'https://api.bfl.ai/v1/get_result';
  private readonly apiKey: string = config.bfl?.apiKey || '';

  constructor(private readonly httpService: HttpService) {}

  /**
   * 将图片 URL 转换为 base64 编码
   * @param imageUrl 图片 URL
   * @returns base64 编码的图片数据
   */
  async imageUrlToBase64(imageUrl: string): Promise<string> {
    try {
      this.logger.log(`正在将图片 URL 转换为 base64: ${imageUrl}`);
      const response = await firstValueFrom(
        this.httpService.get(imageUrl, {
          responseType: 'arraybuffer',
        }),
      );

      const buffer = Buffer.from(response.data, 'binary');
      const base64Image = buffer.toString('base64');
      this.logger.log('图片 URL 成功转换为 base64');
      return base64Image;
    } catch (error) {
      this.logger.error(`将图片 URL 转换为 base64 失败: ${error.message}`);
      throw new Error(`将图片 URL 转换为 base64 失败: ${error.message}`);
    }
  }

  /**
   * 检查字符串是否是 URL
   * @param str 要检查的字符串
   * @returns 是否是 URL
   */
  isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 处理输入图像，如果是 URL 则转换为 base64
   * @param inputImage 输入图像（URL 或 base64）
   * @returns 处理后的 base64 图像数据
   */
  async processInputImage(inputImage: string): Promise<string> {
    // 如果输入是 URL，则转换为 base64
    if (this.isUrl(inputImage)) {
      this.logger.log('检测到图片 URL，正在转换为 base64');
      return await this.imageUrlToBase64(inputImage);
    }
    // 如果已经是 base64 或文件路径，则直接返回
    return inputImage;
  }

  /**
   * 从凭证对象中获取API密钥
   * @param credential 凭证对象或API密钥字符串
   * @returns API密钥
   */
  private getApiKey(credential?: any): string {
    // 如果凭证是字符串，则直接使用
    if (credential && typeof credential === 'string') {
      this.logger.log('使用直接传入的API密钥');
      return credential;
    }

    // 如果凭证是对象，尝试解析
    if (credential && typeof credential === 'object') {
      // 如果已经有api_key属性，直接使用
      if (credential.api_key) {
        return credential.api_key;
      }

      // 尝试解析encryptedData
      if (credential.encryptedData) {
        try {
          const credentialData = JSON.parse(credential.encryptedData);
          if (credentialData.api_key) {
            return credentialData.api_key;
          }
        } catch (error) {
          this.logger.error('处理凭证数据失败:', error);
          // 如果解析失败，尝试直接使用encryptedData作为API密钥
          if (typeof credential.encryptedData === 'string') {
            this.logger.log('尝试直接使用encryptedData作为API密钥');
            return credential.encryptedData;
          }
        }
      }
    }

    // 如果凭证中没有API密钥或处理失败，则使用配置中的API密钥
    if (!this.apiKey) {
      throw new Error('没有配置 BFL AI 的 API Key，请联系管理员。');
    }
    return this.apiKey;
  }

  /**
   * 提交图像生成请求
   * @param dto 请求参数
   * @returns 请求 ID
   */
  async submitRequest(dto: BflAiRequestDto) {
    try {
      const {
        prompt,
        input_image,
        seed,
        aspect_ratio,
        output_format = 'jpeg',
        webhook_url,
        webhook_secret,
        prompt_upsampling = false,
        safety_tolerance = 2,
        credential,
      } = dto;

      // 获取 API 密钥
      const apiKey = this.getApiKey(credential);
      if (!apiKey) {
        throw new Error('缺少 API 密钥');
      }

      // 构建请求体
      const payload = {
        prompt,
        input_image,
        seed,
        aspect_ratio,
        output_format,
        webhook_url,
        webhook_secret,
        prompt_upsampling,
        safety_tolerance,
      };

      // 移除所有 null 和 undefined 值的键
      Object.keys(payload).forEach((key) => {
        if (payload[key] === null || payload[key] === undefined) {
          delete payload[key];
        }
      });

      // 处理输入图像
      if (payload.input_image) {
        payload.input_image = await this.processInputImage(payload.input_image);
      }

      // 记录请求信息
      this.logger.log(`使用的API密钥: ${apiKey.substring(0, 5)}...`);
      this.logger.log(`发送请求到: ${this.apiBaseUrl}`);
      this.logger.log(`请求体: ${JSON.stringify(payload)}`);

      // 打印请求体
      this.logger.log(
        `请求数据: ${JSON.stringify(
          {
            ...payload,
            input_image: payload.input_image
              ? `${payload.input_image.substring(0, 50)}... [图像数据已省略]`
              : undefined,
          },
          null,
          2,
        )}`,
      );
      this.logger.log(`请求体总长度: ${JSON.stringify(payload).length} 字节`);
      this.logger.log(
        `input_image 长度: ${payload.input_image ? payload.input_image.length : 0} 字符`,
      );

      // 发送请求
      const response = await firstValueFrom(
        this.httpService.post(this.apiBaseUrl, payload, {
          headers: {
            'x-key': apiKey,
            'Content-Type': 'application/json',
          },
        }),
      );

      this.logger.log(`响应状态: ${response.status}`);
      this.logger.log(`响应数据: ${JSON.stringify(response.data)}`);

      // 返回请求ID
      const requestId = response.data?.id;
      if (!requestId) {
        throw new Error('未能获取请求 ID');
      }

      return { requestId };
    } catch (error: any) {
      this.logger.error('请求失败:', error.response?.data || error.message);
      throw new Error(
        `BFL AI API 请求失败: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * 查询请求状态
   * @param requestId 请求ID
   * @param credential 凭证
   * @returns 请求状态和结果
   */
  async queryRequestStatus(requestId: string, credential?: any) {
    // 获取API密钥
    const apiKey = this.getApiKey(credential);

    try {
      // 发送请求
      this.logger.log(`查询请求状态: ${requestId}`);
      const response = await firstValueFrom(
        this.httpService.get(this.apiResultUrl, {
          headers: {
            accept: 'application/json',
            'x-key': apiKey,
          },
          params: { id: requestId },
          validateStatus: () => true, // 允许任何状态码，手动处理错误
        }),
      );

      this.logger.log(`状态查询响应: ${JSON.stringify(response.data)}`);

      // 如果返回了 "Task not found"，则返回处理中状态，等待下次轮询
      if (response.data?.status === 'Task not found') {
        this.logger.log(
          `任务未找到，可能正在初始化，等待下次轮询: ${requestId}`,
        );
        return {
          requestId,
          status: 'processing',
          message: '任务正在初始化，请稍后再查询',
        };
      }

      const status = response.data?.status;
      const result = response.data?.result || {};

      // 根据状态返回不同的结果
      if (status === 'Ready') {
        return {
          requestId,
          status: 'completed',
          images: result.sample ? [result.sample] : [],
        };
      } else if (['Processing', 'Queued', 'Pending'].includes(status)) {
        return {
          requestId,
          status: 'processing',
        };
      } else {
        return {
          requestId,
          status: 'failed',
          error: response.data,
        };
      }
    } catch (error: any) {
      // 如果是网络错误，返回处理中状态，等待下次轮询
      this.logger.error(
        `查询请求状态失败 (${requestId}):`,
        error.response?.data || error.message,
      );

      // 如果是 404 错误，返回处理中状态
      if (error.response?.status === 404) {
        this.logger.log(
          `任务未找到，可能正在初始化，等待下次轮询: ${requestId}`,
        );
        return {
          requestId,
          status: 'processing',
          message: '任务正在初始化，请稍后再查询',
        };
      }

      throw new Error(
        `查询请求状态失败: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  /**
   * 执行请求并轮询结果
   * @param requestExecutor 请求执行器函数
   * @param credential 凭证
   * @param maxAttempts 最大尝试次数
   * @param intervalMs 轮询间隔（毫秒）
   * @returns 请求结果
   */
  async executeRequestWithPolling(
    requestExecutor: () => Promise<{ requestId: string }>,
    credential?: any,
    maxAttempts: number = 60,
    intervalMs: number = 3000,
  ) {
    // 执行请求获取请求ID
    const { requestId } = await requestExecutor();

    // 轮询请求状态
    let attempts = 0;
    while (attempts < maxAttempts) {
      // 等待一段时间
      await new Promise((resolve) => setTimeout(resolve, intervalMs));

      // 查询请求状态
      const requestStatus = await this.queryRequestStatus(
        requestId,
        credential,
      );

      // 输出状态日志
      this.logger.log(
        `轮询状态: ${requestStatus.status}, 尝试次数: ${attempts}/${maxAttempts}`,
      );

      // 检查请求是否完成
      if (requestStatus.status === 'completed') {
        this.logger.log(
          `请求完成，返回结果: ${JSON.stringify(requestStatus.images)}`,
        );
        const output = await processContentUrls(requestStatus);

        return output;
      }

      // 检查请求是否失败
      if (requestStatus.status === 'failed') {
        this.logger.error(
          `请求执行失败: ${JSON.stringify(requestStatus.error)}`,
        );
        throw new Error(`请求执行失败: ${JSON.stringify(requestStatus.error)}`);
      }

      // 增加尝试次数
      attempts++;
    }

    // 超过最大尝试次数
    throw new Error(`请求执行超时，请稍后查询请求状态: ${requestId}`);
  }
}
