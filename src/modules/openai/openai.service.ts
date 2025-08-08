import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';
import { config } from '../../common/config';
import { S3Helpers } from '../../common/s3';
import { processContentUrls } from '../../common/utils/output';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly apiBaseUrl = 'https://api.openai.com/v1';

  private readonly s3Helpers: S3Helpers | null = null;
  private readonly s3Enabled: boolean = false;

  constructor(private readonly httpService: HttpService) {
    // 初始化 S3 客户端
    if (config.s3) {
      this.s3Helpers = new S3Helpers();
      this.s3Enabled = true;
    }
  }

  /**
   * 处理输入图片
   * @param input 输入图片（URL、Base64或文件路径）
   * @returns Base64编码的图片数据
   */
  async processInputImage(input: string): Promise<string> {
    if (this.isUrl(input)) {
      return await this.imageUrlToBase64(input);
    } else {
      // 假设是Base64编码
      return input;
    }
  }

  /**
   * 将图片URL转换为Base64
   * @param url 图片URL
   * @returns Base64编码的图片数据
   */
  async imageUrlToBase64(url: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { responseType: 'arraybuffer' }),
      );
      return Buffer.from(response.data).toString('base64');
    } catch (error) {
      this.logger.error(`获取图片失败: ${url}`, error);
      throw new Error(`获取图片失败: ${url}`);
    }
  }

  /**
   * 检查字符串是否为URL
   * @param str 要检查的字符串
   * @returns 是否为URL
   */
  isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取API密钥
   * @param credential 凭据对象
   * @returns API密钥
   */
  getApiKey(credential: any): string {
    try {
      // 如果凭证是字符串，直接返回
      if (credential && typeof credential === 'string') {
        this.logger.log('使用直接传入的API密钥');
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
              this.logger.log('尝试直接使用encryptedData作为API密钥');
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
   * 提交请求
   * @param params 请求参数
   * @returns 请求结果
   */
  async submitRequest(params: any): Promise<any> {
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
      content: processedContent.text,
      model: result.model,
      usage: processedContent.usage,
    };
  }

  /**
   * 格式化结果
   * @param result 原始结果
   * @returns 格式化后的结果
   */
  formatResults(result: any): any {
    return result;
  }

  /**
   * 生成图像
   * @param params 请求参数
   * @param apiKey API密钥
   * @returns 图像生成结果
   */
  async generateImage(params: any, apiKey: string): Promise<any> {
    try {
      this.logger.log('开始图像生成请求');

      // 检查是否有输入图片
      if (params.input_image) {
        // 如果有输入图片，使用图片编辑功能
        return await this.editImage(params, apiKey);
      } else {
        // 如果没有输入图片，使用图片生成功能
        return await this.createImage(params, apiKey);
      }
    } catch (error) {
      this.logger.error(`图像生成失败: ${error.message}`);
      throw new Error(`图像生成失败: ${error.message}`);
    }
  }

  /**
   * 创建新图像
   * @param params 请求参数
   * @param apiKey API密钥
   * @returns 图像生成结果
   */
  private async createImage(params: any, apiKey: string): Promise<any> {
    const requestBody = {
      model: 'gpt-image-1',
      prompt: params.prompt,
      n: params.n || 1,
      size: params.size || '1024x1024',
      quality: params.quality || 'standard',
    };

    this.logger.log(`发送图像生成请求，参数: ${JSON.stringify(requestBody)}`);

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

    const requestId = Date.now().toString();

    const processedImages = await processContentUrls(
      images.map((img: any) => ({
        url: img.url,
        revised_prompt: img.revised_prompt,
      })),
    );

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
  }

  /**
   * 编辑图像
   * @param params 请求参数
   * @param apiKey API密钥
   * @returns 图像编辑结果
   */
  private async editImage(params: any, apiKey: string): Promise<any> {
    // 处理输入图片
    const processedInputImage = await this.processInputImage(
      params.input_image,
    );

    // 构建 multipart/form-data
    const form = new FormData();

    // 添加图片文件
    const imageBuffer = Buffer.from(processedInputImage, 'base64');
    form.append('image', imageBuffer, {
      filename: 'input.png',
      contentType: 'image/png',
    });

    // 添加其他参数
    form.append('model', 'gpt-image-1');
    form.append('prompt', params.prompt);
    form.append('n', params.n || 1);
    form.append('size', params.size || '1024x1024');
    form.append('quality', params.quality || 'standard');

    this.logger.log(
      `发送图像编辑请求，参数: ${JSON.stringify({
        model: 'gpt-image-1',
        prompt: params.prompt,
        n: params.n || 1,
        size: params.size || '1024x1024',
        quality: params.quality || 'standard',
      })}`,
    );

    const response = await firstValueFrom(
      this.httpService.post(`${this.apiBaseUrl}/images/edits`, form, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...form.getHeaders(),
        },
        proxy:
          config.proxy?.enabled && config.proxy?.url
            ? {
                host: new URL(config.proxy.url).hostname,
                port: parseInt(new URL(config.proxy.url).port),
                protocol: new URL(config.proxy.url).protocol,
              }
            : undefined,
      }),
    );

    this.logger.log('收到图像编辑响应');

    const result = response.data;
    const images = result.data || [];

    const requestId = Date.now().toString();

    const processedImages = await processContentUrls(
      images.map((img: any) => ({
        url: img.url,
        revised_prompt: img.revised_prompt,
      })),
    );

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
