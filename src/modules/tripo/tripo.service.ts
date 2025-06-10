import { config } from '@/common/config';
import { TripoRequestDto } from '@/common/schemas/tripo';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TripoService {
  private readonly logger = new Logger(TripoService.name);
  private readonly apiBaseUrl = 'https://api.tripo3d.ai/v2/openapi';
  private readonly apiKey: string = config.tripo?.apiKey || '';

  constructor(private readonly httpService: HttpService) { }

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
            this.logger.log('使用encryptedData作为API密钥');
            return credential.encryptedData;
          }
        } catch (error) {
          this.logger.error('处理凭证数据失败:', error);
        }
      }
    }

    // 如果凭证中没有API密钥或处理失败，则使用配置中的API密钥
    if (!this.apiKey) {
      throw new Error('没有配置 Tripo 的 API Key，请联系管理员。');
    }
    return this.apiKey;
  }

  /**
   * 生成 3D 模型
   * @param dto 请求参数
   * @returns 生成任务的 ID
   */
  async generateModel(dto: TripoRequestDto) {
    try {
      const {
        type = 'text_to_model',
        prompt,
        file,
        files,
        original_model_task_id,
        draft_model_task_id,
        style,
        model_version,
        negative_prompt,
        image_seed,
        model_seed,
        face_limit,
        texture,
        pbr,
        texture_seed,
        texture_quality,
        texture_alignment,
        auto_size,
        orientation,
        quad,
        credential,
        apiKey,
      } = dto;

      // 获取 API 密钥
      const apiKeyValue = apiKey || this.getApiKey(credential);
      if (!apiKeyValue) {
        throw new Error('缺少 API 密钥');
      }

      // 构建请求体
      const requestBody: Record<string, any> = { type };

      // 根据请求类型添加必要字段
      switch (type) {
        case 'text_to_model':
          if (prompt) requestBody.prompt = prompt;
          break;

        case 'image_to_model':
          // 根据文档，image_to_model 可以使用 file 或 files
          if (file) {
            requestBody.file = file;
          } else if (files && files.length > 0) {
            // 如果没有 file 但有 files，使用 files 中的第一个作为 file
            requestBody.file = files[0];
          }
          if (prompt) requestBody.prompt = prompt;
          break;

        case 'multiview_to_model':
          if (files && files.length > 0) requestBody.files = files;
          break;

        case 'texture_model':
          if (original_model_task_id) requestBody.original_model_task_id = original_model_task_id;
          break;

        case 'refine_model':
          if (draft_model_task_id) requestBody.draft_model_task_id = draft_model_task_id;
          break;
      }

      // 添加通用可选字段（如果有值）
      if (style) requestBody.style = style;
      if (model_version) requestBody.model_version = model_version;
      if (negative_prompt) requestBody.negative_prompt = negative_prompt;
      if (image_seed !== undefined) requestBody.image_seed = image_seed;
      if (model_seed !== undefined) requestBody.model_seed = model_seed;
      if (face_limit !== undefined) requestBody.face_limit = face_limit;
      if (texture !== undefined) requestBody.texture = texture;
      if (pbr !== undefined) requestBody.pbr = pbr;
      if (texture_seed !== undefined) requestBody.texture_seed = texture_seed;
      if (texture_quality) requestBody.texture_quality = texture_quality;
      if (texture_alignment) requestBody.texture_alignment = texture_alignment;
      if (auto_size !== undefined) requestBody.auto_size = auto_size;
      if (orientation) requestBody.orientation = orientation;
      if (quad !== undefined) requestBody.quad = quad;

      // 记录请求信息
      this.logger.log(`使用的API密钥: ${apiKeyValue.substring(0, 5)}...`);
      this.logger.log(`发送请求到: ${this.apiBaseUrl}/task`);
      this.logger.log(`请求体: ${JSON.stringify(requestBody)}`);

      // 发送请求，添加超时和重试机制
      let attempts = 0;
      const maxAttempts = 3;
      let response;

      while (attempts < maxAttempts) {
        try {
          response = await firstValueFrom(
            this.httpService.post(`${this.apiBaseUrl}/task`, requestBody, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKeyValue}`,
              },
              timeout: 30000, // 30秒超时
            }),
          );
          break; // 请求成功，跳出循环
        } catch (err) {
          attempts++;
          this.logger.warn(`请求失败，尝试重试 (${attempts}/${maxAttempts})`);

          if (attempts >= maxAttempts) {
            throw err; // 达到最大重试次数，抛出错误
          }

          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      this.logger.log(`响应状态: ${response.status}`);
      this.logger.log(`响应数据: ${JSON.stringify(response.data)}`);

      // 返回任务ID和任务信息
      const taskId = response.data?.data?.task_id;
      return { taskId };
    } catch (error: any) {
      this.logger.error('请求失败:', error.response?.data || error.message);
      throw new Error(`Tripo API 请求失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 查询任务状态
   * @param taskId 任务ID
   * @param credential 凭证
   * @returns 任务状态和结果
   */
  async queryTaskStatus(taskId: string, credential?: any) {
    // 获取API密钥
    const apiKey = this.getApiKey(credential);

    try {
      // 发送请求
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiBaseUrl}/task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }),
      );

      // 返回任务状态和结果
      return {
        taskId,
        status: response.data?.data?.status,
        progress: response.data?.data?.progress,
        output: response.data?.data?.output,
      };
    } catch (error: any) {
      this.logger.error(`查询任务状态失败 (${taskId}):`, error.response?.data || error.message);
      throw new Error(`查询任务状态失败: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 执行任务并轮询结果
   * @param taskExecutor 任务执行器函数
   * @param credential 凭证
   * @param maxAttempts 最大尝试次数
   * @param intervalMs 轮询间隔（毫秒）
   * @returns 任务结果
   */
  async executeTaskWithPolling(
    taskExecutor: () => Promise<{ taskId: string }>,
    credential?: any,
    maxAttempts: number = 60,
    intervalMs: number = 3000,
  ) {
    // 执行任务获取任务ID
    const { taskId } = await taskExecutor();

    // 轮询任务状态
    let attempts = 0;
    while (attempts < maxAttempts) {
      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, intervalMs));

      // 查询任务状态
      const taskStatus = await this.queryTaskStatus(taskId, credential);

      // 检查任务是否完成
      if (taskStatus.status === 'success') {
        return taskStatus;
      }

      // 检查任务是否失败
      if (taskStatus.status === 'failed') {
        throw new Error(`任务执行失败: ${JSON.stringify(taskStatus.output)}`);
      }

      // 增加尝试次数
      attempts++;
    }

    // 超过最大尝试次数
    throw new Error(`任务执行超时，请稍后查询任务状态: ${taskId}`);
  }
}
