import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GoogleGenAI, GoogleGenAIOptions, Modality } from '@google/genai';
import { setGlobalDispatcher, ProxyAgent } from 'undici';
import { S3Helpers } from '../../common/s3';
import { config } from '../../common/config';

@Injectable()
export class GeminiAiService {
  private readonly logger = new Logger(GeminiAiService.name);
  private readonly apiBaseUrl = 'https://generativelanguage.googleapis.com';
  private readonly model = 'gemini-2.0-flash-preview-image-generation';

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
      if (config.gemini && config.gemini.apiKey) {
        return config.gemini.apiKey;
      }

      throw new Error('未找到 Gemini API 密钥');
    } catch (error) {
      this.logger.error(`获取 API 密钥失败: ${error.message}`);
      throw new Error(`获取 API 密钥失败: ${error.message}`);
    }
  }

  /**
   * 提交图像生成请求
   * @param params 请求参数
   * @returns 请求结果
   */
  async submitRequest(params: any): Promise<any> {
    try {
      const apiKey = this.getApiKey(params.credential);

      // 处理输入图像（如果有）
      let processedInputImage = null;
      if (params.input_image) {
        processedInputImage = await this.processInputImage(params.input_image);
      }

      // 创建 Google GenAI 客户端

      if (config.proxy && config.proxy.enabled && config.proxy.url) {
        const dispatcher = new ProxyAgent({
          uri: new URL(config.proxy.url).toString(),
        });

        setGlobalDispatcher(dispatcher);
      }

      const genAIOptions: GoogleGenAIOptions = { apiKey };

      const ai = new GoogleGenAI(genAIOptions);

      try {
        this.logger.log('准备请求内容...');

        // 准备请求内容
        const contents: any[] = [];

        // 添加文本提示
        if (params.prompt) {
          contents.push({ text: params.prompt });
        }

        // 添加输入图像（如果有）
        if (processedInputImage) {
          contents.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: processedInputImage,
            },
          });
        }

        this.logger.log(`请求内容准备完成，包含 ${contents.length} 个部分`);
        this.logger.log('发送请求到 Google Gemini API...');

        // 使用与官方示例相同的调用方式
        const response = await ai.models.generateContent({
          model: this.model,
          contents: contents,
          config: {
            responseModalities: [Modality.TEXT, Modality.IMAGE],
          },
        });

        this.logger.log('收到 Google Gemini API 响应');

        const images = [];
        const textParts = [];

        // 处理响应
        if (response.candidates && response.candidates.length > 0) {
          for (const part of response.candidates[0].content.parts) {
            // 根据部分类型，显示文本或保存图像
            if (part.text) {
              this.logger.log(`收到文本响应: ${part.text.substring(0, 50)}...`);
              textParts.push(part.text);
            } else if (part.inlineData) {
              this.logger.log('收到图像响应');

              // 检查 S3 是否已启用
              if (this.s3Enabled && this.s3Helpers) {
                try {
                  // 上传图像到 S3
                  const imageUrl = await this.uploadBase64ImageToS3(
                    part.inlineData.data,
                    part.inlineData.mimeType || 'image/jpeg',
                  );

                  images.push({ url: imageUrl });
                } catch (uploadError) {
                  this.logger.error(
                    `上传图像到 S3 失败: ${uploadError.message}`,
                  );
                  // 直接抛出错误，不返回 base64 数据
                  throw new Error(`上传图像到 S3 失败: ${uploadError.message}`);
                }
              } else {
                // S3 未启用，抛出错误
                this.logger.error('S3 未启用，无法上传图像');
                throw new Error(
                  'S3 未启用或配置不正确，请配置 S3 存储后再尝试',
                );
              }
            }
          }
        }

        // 生成请求ID
        const requestId = Date.now().toString();

        // 返回请求结果
        return {
          requestId: requestId,
          status: 'completed',
          images: images,
          text: textParts.length > 0 ? textParts.join('\n') : '',
        };
      } catch (apiError) {
        this.logger.error(`Google Gemini API 调用失败: ${apiError.message}`);
        // 直接抛出错误，不返回模拟数据
        throw new Error(`Google Gemini API 调用失败: ${apiError.message}`);
      }
    } catch (error) {
      this.logger.error(`提交请求失败: ${error.message}`);
      throw new Error(`提交请求失败: ${error.message}`);
    }
  }

  /**
   * 格式化返回结果中的图片列表
   * @param result 原始结果对象
   * @returns 格式化后的结果
   */
  formatImageResults(result: any): any {
    // 如果结果中有 images 属性且是数组，则提取图片 URL
    if (result && result.images && Array.isArray(result.images)) {
      // 提取所有图片 URL
      const imageUrls = result.images
        .map((img) => {
          // 如果图片是对象并且有 url 属性
          if (typeof img === 'object' && img.url) {
            return img.url;
          }
          // 如果图片直接是 URL 字符串
          if (typeof img === 'string') {
            return img;
          }
          return null;
        })
        .filter((url) => url !== null);

      // 替换原始结果中的 images
      return {
        ...result,
        images: imageUrls,
      };
    }

    return result;
  }

  /**
   * 执行请求
   * @param params 请求参数
   * @returns 请求结果
   */
  async executeRequest(params: any): Promise<any> {
    try {
      const result = await this.submitRequest(params);
      return this.formatImageResults(result);
    } catch (error) {
      this.logger.error(`执行请求失败: ${error.message}`);
      throw new Error(`执行请求失败: ${error.message}`);
    }
  }

  /**
   * 将 base64 图像数据上传到 S3
   * @param base64Data base64 编码的图像数据
   * @param mimeType 图像的 MIME 类型
   * @returns 上传后的图像 URL
   */
  async uploadBase64ImageToS3(
    base64Data: string,
    mimeType: string = 'image/jpeg',
  ): Promise<string> {
    // 检查 S3 是否已启用
    if (!this.s3Enabled || !this.s3Helpers) {
      throw new Error('S3 未启用或配置不正确');
    }

    try {
      // 1. 清理 base64 数据（如果包含 data URL 前缀）
      const base64WithoutPrefix = base64Data.replace(
        /^data:image\/\w+;base64,/,
        '',
      );

      // 2. 转换为 Buffer
      const buffer = Buffer.from(base64WithoutPrefix, 'base64');

      // 3. 生成唯一文件名
      const extension = mimeType.split('/')[1] || 'jpeg';
      const fileName = `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;

      // 4. 使用 S3Helpers 上传文件
      const imageUrl = await this.s3Helpers.uploadFile(
        buffer,
        fileName,
        mimeType,
      );

      this.logger.log(`图像已上传到 S3: ${imageUrl}`);

      return imageUrl;
    } catch (error) {
      this.logger.error(`上传图像到 S3 失败: ${error.message}`);
      throw new Error(`上传图像到 S3 失败: ${error.message}`);
    }
  }
}
