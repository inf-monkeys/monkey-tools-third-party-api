import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GeminiAiService } from './gemini-ai.service';
import {
  MonkeyToolName,
  MonkeyToolDescription,
  MonkeyToolCategories,
  MonkeyToolCredentials,
  MonkeyToolInput,
  MonkeyToolOutput,
  MonkeyToolDisplayName,
  MonkeyToolIcon,
  MonkeyToolExtra,
} from '@/common/decorators/monkey-block-api-extensions.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { GeminiAiRequestDto } from '@/common/schemas/gemini-ai';
import { config } from '@/common/config';

@ApiTags('Gemini AI')
@Controller('gemini-ai')
@UseGuards(new AuthGuard())
export class GeminiAiController {
  constructor(private readonly geminiAiService: GeminiAiService) {}

  @Post('generate')
  @MonkeyToolName('gemini_ai_image_generate')
  @MonkeyToolDisplayName({
    'zh-CN': 'Gemini 图像生成',
    'en-US': 'Gemini Image Generation',
  })
  @MonkeyToolDescription({
    'zh-CN': '使用 Google Gemini 2.0 Flash 模型生成图像',
    'en-US': 'Generate images using Google Gemini 2.0 Flash model',
  })
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:📷:#4285F4')
  @MonkeyToolCredentials([
    {
      name: 'gemini',
      required: config.gemini?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'baseUrl',
      type: 'string',
      displayName: {
        'zh-CN': 'API 基础 URL',
        'en-US': 'API Base URL',
      },
      description: {
        'zh-CN':
          'API 基础 URL，默认为 https://generativelanguage.googleapis.com',
        'en-US':
          'API Base URL, default is https://generativelanguage.googleapis.com',
      },
      default: 'https://generativelanguage.googleapis.com',
      required: false,
    },
    {
      name: 'model',
      type: 'string',
      displayName: {
        'zh-CN': '模型',
        'en-US': 'Model',
      },
      description: {
        'zh-CN': '模型名称，默认为 gemini-2.0-flash-preview-image-generation',
        'en-US':
          'Model name, default is gemini-2.0-flash-preview-image-generation',
      },
      default: 'gemini-2.0-flash-preview-image-generation',
      required: false,
    },
    {
      name: 'input',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN': '包含提示词、输入图像等参数的JSON对象',
        'en-US':
          'JSON object containing prompt, input image and other parameters',
      },
      default: {
        prompt: '一只可爱的猫咪',
        input_image: '',
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'code',
      displayName: {
        'zh-CN': '状态码',
        'en-US': 'Status Code',
      },
      type: 'number',
      description: {
        'zh-CN': '200 表示成功，其他表示失败',
        'en-US': '200 means success, other means failure',
      },
    },
    {
      name: 'images',
      displayName: {
        'zh-CN': '图像结果',
        'en-US': 'Image Results',
      },
      type: 'json',
      description: {
        'zh-CN': '生成的图像列表',
        'en-US': 'Generated images',
      },
    },
    {
      name: 'text',
      displayName: {
        'zh-CN': '文本结果',
        'en-US': 'Text Results',
      },
      type: 'string',
      description: {
        'zh-CN': '模型返回的文本',
        'en-US': 'Text returned by the model',
      },
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 300,
  })
  public async generate(@Body() body: GeminiAiRequestDto) {
    // 处理输入参数
    let processedBody: any = { ...body };

    // 如果存在 input 字段，将其内容提取到顶层
    if (body.input && typeof body.input === 'object') {
      const { input, ...restBody } = body;
      processedBody = { ...restBody, ...input };
      console.log(
        '处理 input 对象后的请求体：',
        JSON.stringify(processedBody, null, 2),
      );
    }

    const result = await this.geminiAiService.executeRequest(
      processedBody,
      body.model as string | undefined,
      body.baseUrl as string | undefined,
    );

    return {
      code: 200,
      ...result,
    };
  }

  @Post('gemini-2.5-flash-image')
  @MonkeyToolName('gemini_2_5_flash_image_generate')
  @MonkeyToolDisplayName({
    'zh-CN': 'Gemini 2.5 Flash 图像生成',
    'en-US': 'Gemini 2.5 Flash Image Generation',
  })
  @MonkeyToolDescription({
    'zh-CN': '使用 Google Gemini 2.5 Flash Image Preview 模型生成图像',
    'en-US':
      'Generate images using Google Gemini 2.5 Flash Image Preview model',
  })
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:🎨:#4285F4')
  @MonkeyToolCredentials([
    {
      name: 'gemini',
      required: config.gemini?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'baseUrl',
      type: 'string',
      displayName: {
        'zh-CN': 'API 基础 URL',
        'en-US': 'API Base URL',
      },
      description: {
        'zh-CN':
          'API 基础 URL，默认为 https://generativelanguage.googleapis.com',
        'en-US':
          'API Base URL, default is https://generativelanguage.googleapis.com',
      },
      default: 'https://generativelanguage.googleapis.com',
      required: false,
    },
    {
      name: 'input',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN':
          '包含提示词、输入图像、宽高比等参数的JSON对象。aspect_ratio 支持: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9',
        'en-US':
          'JSON object containing prompt, input image, aspect ratio and other parameters. aspect_ratio supports: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9',
      },
      default: {
        prompt: '一只可爱的猫咪在阳光下打盹',
        input_image: '',
        aspect_ratio: '16:9',
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'code',
      displayName: {
        'zh-CN': '状态码',
        'en-US': 'Status Code',
      },
      type: 'number',
      description: {
        'zh-CN': '200 表示成功，其他表示失败',
        'en-US': '200 means success, other means failure',
      },
    },
    {
      name: 'images',
      displayName: {
        'zh-CN': '图像结果',
        'en-US': 'Image Results',
      },
      type: 'json',
      description: {
        'zh-CN': '生成的图像列表',
        'en-US': 'Generated images',
      },
    },
    {
      name: 'text',
      displayName: {
        'zh-CN': '文本结果',
        'en-US': 'Text Results',
      },
      type: 'string',
      description: {
        'zh-CN': '模型返回的文本',
        'en-US': 'Text returned by the model',
      },
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 200,
  })
  public async generate25Flash(@Body() body: GeminiAiRequestDto) {
    // 处理输入参数
    let processedBody: any = { ...body };

    // 如果存在 input 字段，将其内容提取到顶层
    if (body.input && typeof body.input === 'object') {
      const { input, ...restBody } = body;
      processedBody = { ...restBody, ...input };
    }

    // 固定使用 gemini-2.5-flash-image-preview 模型（官方库）
    const result = await this.geminiAiService.executeRequest(
      processedBody,
      'gemini-2.5-flash-image-preview',
      body.baseUrl as string | undefined,
    );

    return {
      code: 200,
      ...result,
    };
  }
}
