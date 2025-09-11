import { Injectable, Logger } from '@nestjs/common';
import { config } from '@/common/config';
import axios from 'axios';
import {
  ImageToVideoRequestDto,
  VideoToVideoRequestDto,
  TextToImageRequestDto,
  VideoUpscaleRequestDto,
  CharacterPerformanceRequestDto,
} from '@/common/schemas/runway';
import { processContentUrls } from '@/common/utils/output';

@Injectable()
export class RunwayService {
  private readonly logger = new Logger(RunwayService.name);
  private readonly baseUrl = 'https://api.dev.runwayml.com/v1';
  private readonly apiKey: string = config.runway?.apiKey || '';
  private readonly apiVersion = '2024-11-06';

  constructor() {}

  /**
   * 从凭证对象中获取 API 密钥
   * @param credential 凭证对象
   * @returns API 密钥
   */
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
      throw new Error('没有配置 Runway API Key，请联系管理员。');
    }
    return this.apiKey;
  }

  /**
   * 获取请求头
   * @param apiKey API密钥
   * @returns 请求头对象
   */
  private getHeaders(apiKey: string) {
    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': this.apiVersion,
    };
  }

  /**
   * 等待任务完成
   * @param taskId 任务ID
   * @param apiKey API密钥
   * @returns 完成的任务结果
   */
  private async waitForTask(taskId: string, apiKey: string): Promise<any> {
    const maxRetries = 120; // 最多等待10分钟
    let retries = 0;

    // 初始等待
    await this.sleep(10000); // 10秒

    while (retries < maxRetries) {
      try {
        this.logger.log(`检查任务状态: ${taskId}, 尝试次数: ${retries + 1}`);

        const response = await axios.get(`${this.baseUrl}/tasks/${taskId}`, {
          headers: this.getHeaders(apiKey),
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1),
              }
            : undefined,
        });

        const task = response.data;
        this.logger.log(`任务状态: ${task.status}`);

        if (task.status === 'SUCCEEDED') {
          this.logger.log('任务完成成功');
          return task;
        } else if (task.status === 'FAILED') {
          this.logger.error('任务失败:', task.failure);
          throw new Error(`任务失败: ${task.failure?.message || '未知错误'}`);
        }

        // 等待5秒后重试
        await this.sleep(5000);
        retries++;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new Error('任务不存在或已被删除');
        }
        this.logger.error(`检查任务状态失败: ${error.message}`);
        throw error;
      }
    }

    throw new Error('任务等待超时');
  }

  /**
   * 延迟函数
   * @param ms 毫秒数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 图片到视频生成
   * @param inputData 请求参数
   * @returns API 响应数据
   */
  async imageToVideo(inputData: ImageToVideoRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('Sending image-to-video request to Runway API');

      console.log('API URL:', `${this.baseUrl}/image_to_video`);
      console.log('API Request Headers:', {
        ...this.getHeaders(apiKey.substring(0, 10) + '...'),
      });
      console.log('API Request Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.baseUrl}/image_to_video`,
        payload,
        {
          headers: this.getHeaders(apiKey),
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1),
              }
            : undefined,
        },
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        requestId: taskId,
      };
    } catch (error) {
      this.logger.error(`Image-to-video API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 视频到视频生成
   * @param inputData 请求参数
   * @returns API 响应数据
   */
  async videoToVideo(inputData: VideoToVideoRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('Sending video-to-video request to Runway API');

      const response = await axios.post(
        `${this.baseUrl}/video_to_video`,
        payload,
        {
          headers: this.getHeaders(apiKey),
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1),
              }
            : undefined,
        },
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        requestId: taskId,
      };
    } catch (error) {
      this.logger.error(`Video-to-video API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 文本到图像生成
   * @param inputData 请求参数
   * @returns API 响应数据
   */
  async textToImage(inputData: TextToImageRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('Sending text-to-image request to Runway API');

      const response = await axios.post(
        `${this.baseUrl}/text_to_image`,
        payload,
        {
          headers: this.getHeaders(apiKey),
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1),
              }
            : undefined,
        },
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        requestId: taskId,
      };
    } catch (error) {
      this.logger.error(`Text-to-image API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 视频放大
   * @param inputData 请求参数
   * @returns API 响应数据
   */
  async videoUpscale(inputData: VideoUpscaleRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('Sending video-upscale request to Runway API');

      const response = await axios.post(
        `${this.baseUrl}/video_upscale`,
        payload,
        {
          headers: this.getHeaders(apiKey),
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1),
              }
            : undefined,
        },
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        requestId: taskId,
      };
    } catch (error) {
      this.logger.error(`Video-upscale API request failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 角色表演控制
   * @param inputData 请求参数
   * @returns API 响应数据
   */
  async characterPerformance(inputData: CharacterPerformanceRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('Sending character-performance request to Runway API');

      const response = await axios.post(
        `${this.baseUrl}/character_performance`,
        payload,
        {
          headers: this.getHeaders(apiKey),
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1),
              }
            : undefined,
        },
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        requestId: taskId,
      };
    } catch (error) {
      this.logger.error(
        `Character-performance API request failed: ${error.message}`,
      );
      throw error;
    }
  }
}
