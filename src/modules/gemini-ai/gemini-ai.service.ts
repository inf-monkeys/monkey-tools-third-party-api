import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { setGlobalDispatcher, ProxyAgent } from 'undici';
import { S3Helpers } from '../../common/s3';
import { config } from '../../common/config';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiAiService {
  private readonly logger = new Logger(GeminiAiService.name);
  private readonly defaultApiBaseUrl =
    'https://generativelanguage.googleapis.com';
  private readonly defaultModel = 'gemini-2.0-flash-preview-image-generation';

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
   * 将图片 URL 转换为 base64，并返回 MIME 类型
   */
  async imageUrlToBase64WithMime(
    url: string,
  ): Promise<{ data: string; mimeType: string }> {
    try {
      this.logger.log(`获取图片并检测 MIME: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
        }),
      );
      const contentType =
        (response.headers?.['content-type'] || '').split(';')[0] ||
        this.guessMimeFromUrl(url) ||
        'image/jpeg';
      const buffer = Buffer.from(response.data, 'binary');
      const base64Image = buffer.toString('base64');
      return { data: base64Image, mimeType: contentType };
    } catch (error) {
      this.logger.error(`获取图片失败: ${error.message}`);
      throw new Error(`获取图片失败: ${error.message}`);
    }
  }

  /**
   * 简单根据 URL 后缀猜测图片 MIME
   */
  private guessMimeFromUrl(url: string): string | null {
    try {
      const lower = url.toLowerCase();
      if (lower.endsWith('.png')) return 'image/png';
      if (lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
        return 'image/jpeg';
      if (lower.endsWith('.webp')) return 'image/webp';
      if (lower.endsWith('.gif')) return 'image/gif';
      return null;
    } catch {
      return null;
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
  async submitRequest(
    params: any,
    model?: string,
    baseUrl?: string,
  ): Promise<any> {
    try {
      const apiKey = this.getApiKey(params.credential);

      // 处理输入图像（支持单个或多个图像）
      const processedInputImages = [];
      if (params.input_image) {
        // 支持数组和单个图像
        const images = Array.isArray(params.input_image)
          ? params.input_image
          : [params.input_image];

        for (const image of images) {
          const processedImage = await this.processInputImage(image);
          processedInputImages.push(processedImage);
        }
      }

      // 创建 Google GenAI 客户端

      if (config.proxy && config.proxy.enabled && config.proxy.url) {
        const dispatcher = new ProxyAgent({
          uri: new URL(config.proxy.url).toString(),
        });

        setGlobalDispatcher(dispatcher);
      }

      const google = createGoogleGenerativeAI({
        baseURL: baseUrl ?? this.defaultApiBaseUrl,
        apiKey,
      });

      const modelInstance = google(model ?? this.defaultModel);

      try {
        const contents: any[] = [];

        // 添加文本提示
        if (params.prompt) {
          contents.push({ type: 'text', text: params.prompt });
        }

        // 添加输入图像（如果有）
        if (processedInputImages.length > 0) {
          processedInputImages.forEach((processedImage) => {
            contents.push({
              type: 'file',
              data: processedImage,
            });
          });
        }

        this.logger.log('发送请求到 Google Gemini API...');
        const response = await modelInstance.doGenerate({
          prompt: [
            {
              role: 'user',
              content: contents,
            },
          ],
        });

        this.logger.log('收到 Google Gemini API 响应');

        const images = [];
        const textParts = [];

        // 处理响应
        if (response.content.length > 0) {
          for (const part of response.content) {
            // 根据部分类型，显示文本或保存图像
            if (part.type === 'text') {
              this.logger.log(`收到文本响应: ${part.text.substring(0, 50)}...`);
              textParts.push(part.text);
            } else if (part.type === 'file') {
              this.logger.log('收到文件响应');

              // 检查 S3 是否已启用
              if (this.s3Enabled && this.s3Helpers) {
                try {
                  // 上传图像到 S3
                  const imageUrl = await this.uploadBase64ImageToS3(
                    part.data.toString(),
                    part.mediaType || 'image/png',
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
      this.logger.error(`提交请求失败:`);
      this.logger.error(error);
      throw new Error(`提交请求失败: ${error.message}`);
    }
  }

  /**
   * 格式化返回结果中的图片列表
   * @param result 原始结果对象
   * @returns 格式化后的结果
   */
  formatImageResults(result: any): any {
    // 安全检查：确保 result 存在
    if (!result) {
      return {
        requestId: Date.now().toString(),
        status: 'completed',
        images: [],
        text: '',
      };
    }

    // 确保 result 有 images 属性，如果没有则初始化为空数组
    if (!result.images) {
      result.images = [];
    }

    // 如果结果中有 images 属性且是数组，则提取图片 URL
    if (Array.isArray(result.images)) {
      // 提取所有图片 URL
      const imageUrls = result.images
        .map((img) => {
          // 如果图片是对象并且有 url 属性
          if (typeof img === 'object' && img !== null && img.url) {
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

    // 如果 images 不是数组，确保返回空数组
    return {
      ...result,
      images: [],
    };
  }

  /**
   * 使用官方 @google/genai 库执行图像生成请求
   * @param params 请求参数
   * @param model 模型名称
   * @returns 请求结果
   */
  async executeImageGenerationRequest(
    params: any,
    model: string = 'gemini-2.5-flash-image',
  ): Promise<any> {
    try {
      const apiKey = this.getApiKey(params.credential);

      this.logger.log(`使用官方库调用 ${model} 进行图像生成`);

      // 设置代理（如果配置了）
      if (config.proxy && config.proxy.enabled && config.proxy.url) {
        const dispatcher = new ProxyAgent({
          uri: new URL(config.proxy.url).toString(),
        });

        setGlobalDispatcher(dispatcher);
        this.logger.log(`已配置代理: ${config.proxy.url}`);
      }

      // 创建 GoogleGenAI 客户端
      const client = new GoogleGenAI({ apiKey });

      // 准备内容
      let contents: any;

      // 统一收集输入图像（支持 input_image 和 input_images）
      const allInputImages: string[] = [];
      if (params.input_image) {
        if (Array.isArray(params.input_image))
          allInputImages.push(...params.input_image);
        else allInputImages.push(params.input_image);
      }
      if (params.input_images && Array.isArray(params.input_images)) {
        allInputImages.push(...params.input_images);
      }

      // 如果只有文本提示，直接传字符串
      if (params.prompt && allInputImages.length === 0) {
        contents = params.prompt;
      } else {
        // 如果有图片或混合内容，使用数组格式
        const contentsArray: any[] = [];

        // 添加文本提示
        if (params.prompt) {
          contentsArray.push({ text: params.prompt });
        }

        // 添加输入图像（支持单个或多个图像）
        if (allInputImages.length > 0) {
          for (const image of allInputImages) {
            // 如果是 URL，带上正确的 MIME
            if (this.isUrl(image)) {
              const { data, mimeType } =
                await this.imageUrlToBase64WithMime(image);
              contentsArray.push({
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: data,
                },
              });
            } else {
              // 处理 data URL
              let mimeType = 'image/jpeg';
              let base64Data = image;
              if (image.startsWith('data:image/')) {
                const match = image.match(/^data:(image\/[^;]+);base64,(.*)$/);
                if (match) {
                  mimeType = match[1];
                  base64Data = match[2];
                }
              }
              contentsArray.push({
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              });
            }
          }
        }

        contents = contentsArray;
      }

      // 为模型注入系统级指令，确保：直接出图、不问再确认、不提下载与分辨率
      const systemInstructionText = [
        'You are an image generation tool. ',
        'Directly generate the image from the user prompt without asking reconfirmation or clarification. ',
        'Do not mention anything related to downloading the image. ',
        'Do not mention anything related to resolution. ',
        'If both text and image are possible, return image only.',
      ].join('');

      // 处理可选的宽高比（aspect_ratio）配置
      const allowedAspectRatios = new Set([
        '1:1',
        '2:3',
        '3:2',
        '3:4',
        '4:3',
        '4:5',
        '5:4',
        '9:16',
        '16:9',
        '21:9',
      ]);
      const aspectRatioParam = (params &&
        (params.aspect_ratio || params.aspectRatio)) as string | undefined;

      const requestConfig: any = {
        systemInstruction: systemInstructionText,
        responseModalities: ['Image'],
      };

      if (aspectRatioParam && allowedAspectRatios.has(aspectRatioParam)) {
        requestConfig.imageConfig = { aspectRatio: aspectRatioParam };
        this.logger.log(`已设置宽高比: ${aspectRatioParam}`);
      } else if (aspectRatioParam) {
        this.logger.warn(
          `收到不支持的宽高比: ${aspectRatioParam}，将使用默认比例（与输入图一致或1:1）`,
        );
      }

      this.logger.log('发送请求到 Google Gemini API (官方库)...');
      this.logger.log(
        `请求配置: ${JSON.stringify({ model, config: requestConfig }, null, 2)}`,
      );

      // 如果包含受支持的宽高比，优先使用原生 REST API 直接下发 generationConfig.imageConfig
      // 说明：当前 @google/genai 对 generateContent 的 config 映射未包含 imageConfig，直接调用会被忽略
      let response: any;
      if (requestConfig.imageConfig?.aspectRatio) {
        try {
          const restUrl = `${this.defaultApiBaseUrl}/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

          // 将 contents 规范化为 REST 需要的结构
          const restParts: any[] = [];
          if (typeof contents === 'string') {
            restParts.push({ text: contents });
          } else if (Array.isArray(contents)) {
            for (const p of contents) {
              if (p.text) restParts.push({ text: p.text });
              else if (p.inlineData)
                restParts.push({ inlineData: p.inlineData });
            }
          }

          const restBody: any = {
            contents: [
              {
                role: 'user',
                parts: restParts,
              },
            ],
            generationConfig: {
              responseModalities: requestConfig.responseModalities,
              imageConfig: {
                aspectRatio: requestConfig.imageConfig.aspectRatio,
              },
            },
          };

          if (requestConfig.systemInstruction) {
            restBody.systemInstruction = {
              role: 'system',
              parts: [{ text: requestConfig.systemInstruction }],
            };
          }

          this.logger.log(
            `使用 REST 方式调用以传递 imageConfig.aspectRatio (${requestConfig.imageConfig.aspectRatio})`,
          );
          const httpResp = await firstValueFrom(
            this.httpService.post(restUrl, restBody, {
              headers: { 'Content-Type': 'application/json' },
              responseType: 'json',
            }),
          );
          response = httpResp.data;
        } catch (restErr) {
          this.logger.warn(
            `REST 方式调用失败，回退到 SDK: ${restErr?.message || restErr}`,
          );
          response = await client.models.generateContent({
            model: model,
            contents: contents,
            config: requestConfig,
          });
        }
      } else {
        // 使用 generateContent 方法（SDK）
        response = await client.models.generateContent({
          model: model,
          contents: contents,
          config: requestConfig,
        });
      }

      this.logger.log('收到 Google Gemini API 响应 (官方库)');

      const images = [];
      const imageMetadata: Array<{
        url: string;
        mimeType: string;
        width?: number;
        height?: number;
      }> = [];
      const textParts = [];

      // 处理响应
      const candidates = response.candidates || response.candidates?.candidates;
      if (candidates && candidates.length > 0) {
        for (const candidate of candidates) {
          const content = candidate.content || candidate;
          if (content && content.parts) {
            for (const part of content.parts) {
              if (part.text) {
                this.logger.log(
                  `收到文本响应: ${part.text.substring(0, 50)}...`,
                );
                textParts.push(part.text);
              } else if (part.inlineData) {
                this.logger.log('收到图像响应');

                // 检查 S3 是否已启用
                if (this.s3Enabled && this.s3Helpers) {
                  try {
                    // 上传图像到 S3
                    const imageUrl = await this.uploadBase64ImageToS3(
                      part.inlineData.data,
                      part.inlineData.mimeType || 'image/png',
                    );

                    images.push({ url: imageUrl });
                    // 尝试解析尺寸
                    try {
                      const dims = this.parseBase64ImageDimensions(
                        part.inlineData.data,
                        part.inlineData.mimeType || 'image/png',
                      );
                      if (dims) {
                        imageMetadata.push({
                          url: imageUrl,
                          mimeType: part.inlineData.mimeType || 'image/png',
                          width: dims.width,
                          height: dims.height,
                        });
                        this.logger.log(
                          `图像尺寸: ${dims.width}x${dims.height}`,
                        );
                      } else {
                        imageMetadata.push({
                          url: imageUrl,
                          mimeType: part.inlineData.mimeType || 'image/png',
                        });
                      }
                    } catch (e) {
                      this.logger.warn(`解析图像尺寸失败: ${e.message}`);
                      imageMetadata.push({
                        url: imageUrl,
                        mimeType: part.inlineData.mimeType || 'image/png',
                      });
                    }
                  } catch (uploadError) {
                    this.logger.error(
                      `上传图像到 S3 失败: ${uploadError.message}`,
                    );
                    throw new Error(
                      `上传图像到 S3 失败: ${uploadError.message}`,
                    );
                  }
                } else {
                  // S3 未启用，直接返回 data URL
                  const mime = part.inlineData.mimeType || 'image/png';
                  const dataUrl = `data:${mime};base64,${part.inlineData.data}`;
                  images.push({ url: dataUrl });
                  // 尝试解析尺寸
                  try {
                    const dims = this.parseBase64ImageDimensions(
                      part.inlineData.data,
                      mime,
                    );
                    if (dims) {
                      imageMetadata.push({
                        url: dataUrl,
                        mimeType: mime,
                        width: dims.width,
                        height: dims.height,
                      });
                      this.logger.log(`图像尺寸: ${dims.width}x${dims.height}`);
                    } else {
                      imageMetadata.push({ url: dataUrl, mimeType: mime });
                    }
                  } catch (e) {
                    this.logger.warn(`解析图像尺寸失败: ${e.message}`);
                    imageMetadata.push({ url: dataUrl, mimeType: mime });
                  }
                }
              }
            }
          }
        }
      }

      // 生成请求ID
      const requestId = Date.now().toString();

      // 返回请求结果
      const baseResult: any = {
        requestId: requestId,
        status: 'completed',
        images: images,
        text: textParts.length > 0 ? textParts.join('\n') : '',
      };

      if (params && params.debug === true) {
        baseResult.image_metadata = imageMetadata;
      }

      return baseResult;
    } catch (error) {
      this.logger.error(`官方库图像生成失败: ${error.message}`);
      this.logger.error(`错误详情: ${JSON.stringify(error, null, 2)}`);
      if (error.code) {
        this.logger.error(`错误代码: ${error.code}`);
      }
      if (error.status) {
        this.logger.error(`HTTP状态码: ${error.status}`);
      }
      throw new Error(`图像生成失败: ${error.message}`);
    }
  }

  /**
   * 执行请求
   * @param params 请求参数
   * @returns 请求结果
   */
  async executeRequest(
    params: any,
    model?: string,
    baseUrl?: string,
  ): Promise<any> {
    try {
      this.logger.log(`接收到参数: ${JSON.stringify(params, null, 2)}`);
      this.logger.log(`模型: ${model}`);

      // 如果是图像生成模型，使用官方库
      if (
        model &&
        (model.includes('image') || model === 'gemini-2.5-flash-image')
      ) {
        this.logger.log('使用图像生成模式');
        const result = await this.executeImageGenerationRequest(params, model);
        this.logger.log(`图像生成结果: ${JSON.stringify(result, null, 2)}`);
        const formatted = this.formatImageResults(result);
        this.logger.log(
          `格式化后的结果: ${JSON.stringify(formatted, null, 2)}`,
        );
        return formatted;
      }

      // 否则使用原有的 ai-sdk 方式
      this.logger.log('使用 ai-sdk 模式');
      const result = await this.submitRequest(params, model, baseUrl);
      this.logger.log(`AI SDK 结果: ${JSON.stringify(result, null, 2)}`);
      const formatted = this.formatImageResults(result);
      this.logger.log(`格式化后的结果: ${JSON.stringify(formatted, null, 2)}`);
      return formatted;
    } catch (error) {
      this.logger.error(`执行请求失败: ${error.message}`);
      this.logger.error(`错误堆栈: ${error.stack}`);
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

  private parseBase64ImageDimensions(
    base64Data: string,
    mimeType: string,
  ): {
    width: number;
    height: number;
  } | null {
    try {
      const buffer = Buffer.from(
        base64Data.replace(/^data:[^,]+,/, ''),
        'base64',
      );
      if (mimeType.includes('png')) {
        return this.readPngDimensions(buffer);
      }
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
        return this.readJpegDimensions(buffer);
      }
      return null;
    } catch (e) {
      this.logger.warn(`解析Base64图像尺寸异常: ${e.message}`);
      return null;
    }
  }

  private readPngDimensions(
    buffer: Buffer,
  ): { width: number; height: number } | null {
    if (buffer.length < 24) return null;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;
    if (!isPng) return null;
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  private readJpegDimensions(
    buffer: Buffer,
  ): { width: number; height: number } | null {
    if (buffer.length < 4) return null;
    if (!(buffer[0] === 0xff && buffer[1] === 0xd8)) return null;
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      let marker = buffer[offset + 1];
      while (marker === 0xff) {
        offset++;
        marker = buffer[offset + 1];
      }
      if (marker === 0xd9 || marker === 0xda) break;
      const length = buffer.readUInt16BE(offset + 2);
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      offset += 2 + length;
    }
    return null;
  }
}
