import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { S3Helpers } from '../../common/s3';
import { config } from '../../common/config';
import { processContentUrls } from '../../common/utils/output';
import FormData from 'form-data';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly apiBaseUrl = 'https://api.openai.com/v1';

  private readonly s3Helpers: S3Helpers | null = null;
  private readonly s3Enabled: boolean = false;

  constructor(private readonly httpService: HttpService) {
    // 只有在 S3 配置存在时才初始化 S3Helpers
    if (
      config.s3 &&
      config.s3.bucket &&
      config.s3.accessKeyId &&
      config.s3.secretAccessKey
    ) {
      try {
        this.s3Helpers = new S3Helpers();
        this.s3Enabled = true;
        this.logger.log('S3 存储已启用');
      } catch (error) {
        this.logger.error(`初始化 S3Helpers 失败: ${error.message}`);
        this.s3Enabled = false;
      }
    } else {
      this.logger.warn('S3 配置不完整，将使用 base64 数据返回图像');
      this.s3Enabled = false;
    }
  }

  /**
   * 处理输入图像，如果是 URL 则转换为 base64
   * @param input 输入图像（URL 或 base64）
   * @returns 处理后的 base64 图像
   */
  async processInputImage(input: string): Promise<string> {
    if (this.isUrl(input)) {
      return this.imageUrlToBase64(input);
    }
    return input;
  }

  /**
   * 将图片 URL 转换为 base64
   * @param url 图片 URL
   * @returns base64 编码的图片
   */
  async imageUrlToBase64(url: string): Promise<string> {
    try {
      this.logger.log(`将图片 URL 转换为 base64: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url, {
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
   * 从凭证对象中获取API密钥
   * @param credential 凭证对象或API密钥字符串
   * @returns API密钥
   */
  getApiKey(credential: any): string {
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
      if (config.openai && config.openai.apiKey) {
        return config.openai.apiKey;
      }

      throw new Error('未找到 OpenAI API 密钥');
    } catch (error) {
      this.logger.error(`获取 API 密钥失败: ${error.message}`);
      throw new Error(`获取 API 密钥失败: ${error.message}`);
    }
  }

  /**
   * 提交 OpenAI 请求
   * @param params 请求参数
   * @returns 请求结果
   */
  async submitRequest(params: any): Promise<any> {
    try {
      const apiKey = this.getApiKey(params.credential);

      // 检查是否是图像生成模型
      if (params.model === 'gpt-image-1') {
        return await this.generateImage(params, apiKey);
      }

      // 处理输入图像（如果有）
      let processedInputImage = null;
      if (params.input_image) {
        processedInputImage = await this.processInputImage(params.input_image);
      }

      // 构建消息数组
      const messages = [];
      // 添加系统提示词（如果有）
      if (params.system_prompt) {
        messages.push({
          role: 'system',
          content: params.system_prompt,
        });
      }

      // 添加用户消息
      if (processedInputImage) {
        // 图像分析模式
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: params.prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${processedInputImage}`,
                detail: params.detail || 'auto',
              },
            },
          ],
        });
      } else {
        // 文本生成模式
        messages.push({
          role: 'user',
          content: params.prompt,
        });
      }

      // 构建请求体
      const requestBody = {
        model: params.model || 'gpt-4o',
        messages: messages,
        max_tokens: params.max_tokens || 1000,
        temperature: params.temperature || 0.7,
      };

      this.logger.log(`发送请求到 OpenAI API，模型: ${requestBody.model}`);

      // 发送请求
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiBaseUrl}/chat/completions`,
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            proxy:
              config.proxy?.enabled && config.proxy?.url
                ? {
                    host: new URL(config.proxy.url).hostname,
                    port: parseInt(new URL(config.proxy.url).port),
                    protocol: new URL(config.proxy.url).protocol,
                  }
                : undefined,
          },
        ),
      );

      this.logger.log('收到 OpenAI API 响应');

      const result = response.data;
      const content = result.choices?.[0]?.message?.content || '';

      // 生成请求ID
      const requestId = result.id || Date.now().toString();

      // 处理返回内容中的 URL
      const processedContent = await processContentUrls({
        text: content,
        model: result.model,
        usage: result.usage,
      });

      // 返回请求结果
      return {
        requestId: requestId,
        status: 'completed',
        ...processedContent,
      };
    } catch (error) {
      this.logger.error(`OpenAI API 调用失败: ${error.message}`);
      throw new Error(`OpenAI API 调用失败: ${error.message}`);
    }
  }

  /**
   * 格式化返回结果
   * @param result 原始结果对象
   * @returns 格式化后的结果
   */
  formatResults(result: any): any {
    return result;
  }

  /**
   * 生成或编辑图像
   * @param params 请求参数
   * @param apiKey API密钥
   * @returns 图像生成/编辑结果
   */
  async generateImage(params: any, apiKey: string): Promise<any> {
    try {
      this.logger.log(
        `开始图像${params.operation === 'edit' ? '编辑' : '生成'}请求`,
      );

      // 检查是否为图像编辑模式
      if (params.operation === 'edit' && params.input_image) {
        return await this.editImage(params, apiKey);
      }

      // 构建图像生成请求体 - 使用真正的 gpt-image-1 模型
      const requestBody = {
        model: 'gpt-image-1',
        prompt: params.prompt,
        n: params.n || 1,
        size: params.size || '1024x1024',
        quality: params.quality || 'hd',
        style: params.style || 'natural',
      };

      this.logger.log(`发送图像生成请求，参数: ${JSON.stringify(requestBody)}`);

      // 发送图像生成请求
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiBaseUrl}/images/generations`,
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            proxy:
              config.proxy?.enabled && config.proxy?.url
                ? {
                    host: new URL(config.proxy.url).hostname,
                    port: parseInt(new URL(config.proxy.url).port),
                    protocol: new URL(config.proxy.url).protocol,
                  }
                : undefined,
          },
        ),
      );

      this.logger.log('收到图像生成响应');

      const result = response.data;
      const images = result.data || [];

      // 生成请求ID
      const requestId = Date.now().toString();

      // 处理图像 URL，上传到 S3
      const processedImages = await processContentUrls(
        images.map((img: any) => ({
          url: img.url,
          revised_prompt: img.revised_prompt,
        })),
      );

      // 返回图像生成结果
      return {
        requestId: requestId,
        status: 'completed',
        images: processedImages,
        model: 'gpt-image-1',
        usage: {
          prompt_tokens: params.prompt.length,
          completion_tokens: 0,
          total_tokens: params.prompt.length,
        },
      };
    } catch (error) {
      this.logger.error(`图像生成失败: ${error.message}`);
      throw new Error(`图像生成失败: ${error.message}`);
    }
  }

  /**
   * 编辑图像
   * @param params 请求参数
   * @param apiKey API密钥
   * @returns 图像编辑结果
   */
  async editImage(params: any, apiKey: string): Promise<any> {
    try {
      this.logger.log('开始图像编辑请求');

      // 处理输入图像
      const imageData = await this.processInputImage(params.input_image);

      // 构建FormData用于图像编辑
      const formData = new FormData();

      // 将base64转为buffer
      const imageBuffer = Buffer.from(imageData, 'base64');
      formData.append('image', imageBuffer, 'image.png');
      formData.append('model', 'gpt-image-1');
      formData.append('prompt', params.prompt);
      formData.append('n', params.n || 1);
      formData.append('size', params.size || '1024x1024');
      formData.append('quality', params.quality || 'hd');

      // 如果有蒙版图像，也添加进去
      if (params.mask_image) {
        const maskData = await this.processInputImage(params.mask_image);
        const maskBuffer = Buffer.from(maskData, 'base64');
        formData.append('mask', maskBuffer, 'mask.png');
      }

      this.logger.log('发送图像编辑请求');

      // 发送图像编辑请求
      const response = await firstValueFrom(
        this.httpService.post(`${this.apiBaseUrl}/images/edits`, formData, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
          proxy:
            config.proxy?.enabled && config.proxy?.url
              ? {
                  host: new URL(config.proxy.url).hostname,
                  port: parseInt(new URL(config.proxy.url).port) || 80,
                }
              : false,
          timeout: 120000,
        }),
      );

      const imageEditResult = response.data;
      this.logger.log(
        `图像编辑完成，生成了 ${imageEditResult.data?.length || 0} 张图像`,
      );

      // 处理生成的图像URL并上传到S3 - 使用与图像生成相同的处理方式
      const processedImages = await processContentUrls(
        imageEditResult.data?.map((img: any) => ({
          url: img.url,
          revised_prompt: img.revised_prompt || params.prompt,
        })) || [],
      );

      // 生成请求ID
      const requestId = Date.now().toString();

      return {
        requestId: requestId,
        status: 'completed',
        data: processedImages,
        created: imageEditResult.created,
        usage: imageEditResult.usage,
      };
    } catch (error) {
      this.logger.error(`图像编辑失败: ${error.message}`);
      throw new Error(`图像编辑失败: ${error.message}`);
    }
  }

  /**
   * 执行请求
   * @param params 请求参数
   * @returns 请求结果
   */
  async executeRequest(params: any): Promise<any> {
    try {
      const result = await this.submitRequest(params);
      return this.formatResults(result);
    } catch (error) {
      this.logger.error(`执行请求失败: ${error.message}`);
      throw new Error(`执行请求失败: ${error.message}`);
    }
  }
}
