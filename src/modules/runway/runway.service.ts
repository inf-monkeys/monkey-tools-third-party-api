import { config } from '@/common/config';
import {
  RunwayRequestDto,
  ImageToVideoRequestDto,
  VideoToVideoRequestDto,
  TextToImageRequestDto,
  VideoUpscaleRequestDto,
  CharacterPerformanceRequestDto,
} from '@/common/schemas/runway';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { processContentUrls } from '@/common/utils/output';

@Injectable()
export class RunwayService {
  private readonly logger = new Logger(RunwayService.name);
  private readonly baseUrl = 'https://api.dev.runwayml.com/v1';
  private readonly apiKey: string = config.runway?.apiKey || '';
  private readonly requiredHeaders = {
    'X-Runway-Version': '2024-11-06',
    'Content-Type': 'application/json',
  };

  constructor(private readonly httpService: HttpService) {}

  /**
   * 从凭证对象中获取 API 密钥
   * @param credential 凭证对象
   * @returns API 密钥
   */
  private getApiKey(credential?: any): string {
    try {
      // 如果凭证是字符串，直接返回
      if (typeof credential === 'string') {
        return credential;
      }

      // 如果凭证是对象
      if (credential && typeof credential === 'object') {
        // 如果有 apiKey 或 api_key 属性
        if (credential.apiKey) return credential.apiKey;
        if (credential.api_key) return credential.api_key;

        // 尝试解析 encryptedData
        if (credential.encryptedData) {
          try {
            // 首先尝试解析为 JSON
            const credentialData = JSON.parse(credential.encryptedData);
            if (credentialData.apiKey) return credentialData.apiKey;
            if (credentialData.api_key) return credentialData.api_key;
          } catch (e) {
            // 如果解析失败，尝试直接使用 encryptedData
            if (typeof credential.encryptedData === 'string') {
              return credential.encryptedData;
            }
          }
        }
      }

      // 使用配置中的 API 密钥
      if (config.runway && config.runway.apiKey) {
        return config.runway.apiKey;
      }

      throw new Error('未找到 Runway API 密钥');
    } catch (error) {
      this.logger.error(`获取 API 密钥失败: ${error.message}`);
      throw new Error(`获取 API 密钥失败: ${error.message}`);
    }
  }

  /**
   * 等待任务完成
   * @param taskId 任务 ID
   * @param apiKey API 密钥
   * @returns 完成的任务对象
   */
  private async waitForTask(taskId: string, apiKey: string): Promise<any> {
    const maxRetries = 60; // 最多等待5分钟
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`${this.baseUrl}/tasks/${taskId}`, {
            headers: {
              ...this.requiredHeaders,
              Authorization: `Bearer ${apiKey}`,
            },
            proxy: config.proxy?.url
              ? {
                  host: new URL(config.proxy.url).hostname,
                  port: parseInt(new URL(config.proxy.url).port),
                  protocol: new URL(config.proxy.url).protocol.slice(0, -1) as
                    | 'http'
                    | 'https',
                }
              : undefined,
          }),
        );

        const task = response.data;
        this.logger.log(`任务 ${taskId} 状态: ${task.status}`);

        if (task.status === 'SUCCEEDED') {
          this.logger.log(
            `任务成功完成，返回数据结构:`,
            JSON.stringify(task, null, 2),
          );
          return task;
        } else if (task.status === 'FAILED') {
          this.logger.error(`任务失败详情:`, JSON.stringify(task, null, 2));
          throw new Error(`任务失败: ${JSON.stringify(task)}`);
        }

        // 等待5秒后重试
        await new Promise((resolve) => setTimeout(resolve, 5000));
        retries++;
      } catch (error) {
        this.logger.error(`检查任务状态失败: ${error.message}`);
        throw error;
      }
    }

    throw new Error(`任务 ${taskId} 超时，超过最大等待时间`);
  }

  /**
   * 图像转视频
   * @param inputData 请求参数
   * @returns 生成的视频
   */
  async imageToVideo(inputData: ImageToVideoRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('发送图像转视频请求到 Runway API');
      console.log('API Request Payload:', JSON.stringify(payload, null, 2));

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/image_to_video`, payload, {
          headers: {
            ...this.requiredHeaders,
            Authorization: `Bearer ${apiKey}`,
          },
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1) as
                  | 'http'
                  | 'https',
              }
            : undefined,
        }),
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);

      // 处理输出 URL
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        taskId: taskId,
        requestId: response.headers['x-request-id'] || '',
      };
    } catch (error) {
      this.logger.error(`图像转视频请求失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 视频转视频
   * @param inputData 请求参数
   * @returns 生成的视频
   */
  async videoToVideo(inputData: VideoToVideoRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('发送视频转视频请求到 Runway API');
      console.log('API Request Payload:', JSON.stringify(payload, null, 2));

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/video_to_video`, payload, {
          headers: {
            ...this.requiredHeaders,
            Authorization: `Bearer ${apiKey}`,
          },
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1) as
                  | 'http'
                  | 'https',
              }
            : undefined,
        }),
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);

      // 处理输出 URL
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        taskId: taskId,
        requestId: response.headers['x-request-id'] || '',
      };
    } catch (error) {
      this.logger.error(`视频转视频请求失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 文本转图像
   * @param inputData 请求参数
   * @returns 生成的图像
   */
  async textToImage(inputData: TextToImageRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('发送文本转图像请求到 Runway API');
      console.log('API Request Payload:', JSON.stringify(payload, null, 2));

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/text_to_image`, payload, {
          headers: {
            ...this.requiredHeaders,
            Authorization: `Bearer ${apiKey}`,
          },
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1) as
                  | 'http'
                  | 'https',
              }
            : undefined,
        }),
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);

      // 处理输出 URL
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        taskId: taskId,
        requestId: response.headers['x-request-id'] || '',
      };
    } catch (error) {
      this.logger.error(`文本转图像请求失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 视频放大
   * @param inputData 请求参数
   * @returns 放大的视频
   */
  async videoUpscale(inputData: VideoUpscaleRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('发送视频放大请求到 Runway API');
      console.log('API Request Payload:', JSON.stringify(payload, null, 2));

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/video_upscale`, payload, {
          headers: {
            ...this.requiredHeaders,
            Authorization: `Bearer ${apiKey}`,
          },
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1) as
                  | 'http'
                  | 'https',
              }
            : undefined,
        }),
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);

      // 处理输出 URL
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        taskId: taskId,
        requestId: response.headers['x-request-id'] || '',
      };
    } catch (error) {
      this.logger.error(`视频放大请求失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 角色表演控制
   * @param inputData 请求参数
   * @returns 生成的表演视频
   */
  async characterPerformance(inputData: CharacterPerformanceRequestDto) {
    try {
      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      const payload = { ...inputData.inputs };

      this.logger.log('发送角色表演控制请求到 Runway API');
      console.log('API Request Payload:', JSON.stringify(payload, null, 2));

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/character_performance`,
          payload,
          {
            headers: {
              ...this.requiredHeaders,
              Authorization: `Bearer ${apiKey}`,
            },
            proxy: config.proxy?.url
              ? {
                  host: new URL(config.proxy.url).hostname,
                  port: parseInt(new URL(config.proxy.url).port),
                  protocol: new URL(config.proxy.url).protocol.slice(0, -1) as
                    | 'http'
                    | 'https',
                }
              : undefined,
          },
        ),
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);

      // 处理输出 URL
      const output = await processContentUrls(completedTask);

      return {
        data: output,
        taskId: taskId,
        requestId: response.headers['x-request-id'] || '',
      };
    } catch (error) {
      this.logger.error(`角色表演控制请求失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 通用 API 调用方法
   * @param inputData 请求参数
   * @returns API 响应数据
   */
  async callApi(inputData: RunwayRequestDto) {
    try {
      this.logger.log('输入数据:', JSON.stringify(inputData, null, 2));

      const apiKey = this.getApiKey(inputData.credential);
      if (!apiKey) {
        throw new Error('API Key is empty');
      }

      this.logger.log('成功获取API密钥');

      // 从 inputs 或顶层获取参数
      const inputs = inputData.inputs || {};
      const payload = {
        ...inputs,
        // 支持在顶层直接传递常用参数
        ...(inputData.promptText && { promptText: inputData.promptText }),
        ...(inputData.promptImage && { promptImage: inputData.promptImage }),
        ...(inputData.videoUri && { videoUri: inputData.videoUri }),
        ...(inputData.model && { model: inputData.model }),
        ...(inputData.ratio && { ratio: inputData.ratio }),
        ...(inputData.seed && { seed: inputData.seed }),
      };

      // 清理payload中的undefined值和空数组
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
        // 对于某些特定字段，如果是空数组也删除
        if (Array.isArray(payload[key]) && payload[key].length === 0) {
          if (['referenceImages', 'references'].includes(key)) {
            delete payload[key];
          }
        }
      });

      // 根据模型类型选择合适的端点
      let endpoint = '';
      if (payload.model) {
        if (['gen4_turbo', 'gen3a_turbo'].includes(payload.model)) {
          endpoint = '/image_to_video';
        } else if (payload.model === 'gen4_aleph') {
          endpoint = '/video_to_video';
        } else if (['gen4_image', 'gen4_image_turbo'].includes(payload.model)) {
          endpoint = '/text_to_image';
        } else if (payload.model === 'upscale_v1') {
          endpoint = '/video_upscale';
        } else if (payload.model === 'act_two') {
          endpoint = '/character_performance';
        }
      }

      if (!endpoint) {
        throw new Error('无法确定API端点，请检查模型参数');
      }

      this.logger.log(`发送请求到 Runway API: ${endpoint}`);
      console.log('API Request Payload:', JSON.stringify(payload, null, 2));

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}${endpoint}`, payload, {
          headers: {
            ...this.requiredHeaders,
            Authorization: `Bearer ${apiKey}`,
          },
          proxy: config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol.slice(0, -1) as
                  | 'http'
                  | 'https',
              }
            : undefined,
        }),
      );

      const taskId = response.data.id;
      this.logger.log(`任务已创建，ID: ${taskId}`);

      // 等待任务完成
      const completedTask = await this.waitForTask(taskId, apiKey);

      this.logger.log(
        '完成的任务数据:',
        JSON.stringify(completedTask, null, 2),
      );

      // 处理输出 URL - 添加安全检查
      let output;
      try {
        output = await processContentUrls(completedTask);
      } catch (processError) {
        this.logger.error('处理输出URL时发生错误:', processError.message);
        this.logger.error(
          '原始任务数据:',
          JSON.stringify(completedTask, null, 2),
        );
        // 如果处理失败，直接返回原始数据
        output = completedTask;
      }

      return {
        data: output,
        taskId: taskId,
        requestId: response.headers['x-request-id'] || '',
      };
    } catch (error) {
      this.logger.error(`Runway API 请求失败: ${error.message}`);
      throw error;
    }
  }
}
