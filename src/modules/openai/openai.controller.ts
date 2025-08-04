import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OpenAiService } from './openai.service';
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
import { OpenAiRequestDto } from '@/common/schemas/openai';
import { config } from '@/common/config';

@ApiTags('OpenAI')
@Controller('openai')
@UseGuards(new AuthGuard())
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Post('generate')
  @MonkeyToolName('openai_gpt4_vision')
  @MonkeyToolDisplayName({
    'zh-CN': 'OpenAI GPT-4 Vision',
    'en-US': 'OpenAI GPT-4 Vision',
  })
  @MonkeyToolDescription({
    'zh-CN': '使用 OpenAI GPT-4 Vision 进行图像分析和文本生成',
    'en-US': 'Use OpenAI GPT-4 Vision for image analysis and text generation',
  })
  @MonkeyToolCategories(['ai-analysis', 'text-generation'])
  @MonkeyToolIcon('emoji:🤖:#10A37F')
  @MonkeyToolCredentials([
    {
      name: 'openai',
      required: config.openai?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'input',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN': '包含提示词、输入图像等参数的JSON对象。如果有input_image字段则进行图像分析，否则进行文本生成',
        'en-US':
          'JSON object containing prompt, input image and other parameters. If input_image is provided, performs image analysis, otherwise performs text generation',
      },
      default: {
        prompt: '请分析这张图片',
        input_image: '',
        model: 'gpt-4o',
        max_tokens: 1000,
        temperature: 0.7,
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
      name: 'text',
      displayName: {
        'zh-CN': '文本结果',
        'en-US': 'Text Results',
      },
      type: 'string',
      description: {
        'zh-CN': 'AI 模型返回的文本内容',
        'en-US': 'Text content returned by AI model',
      },
    },
    {
      name: 'model',
      displayName: {
        'zh-CN': '使用的模型',
        'en-US': 'Model Used',
      },
      type: 'string',
      description: {
        'zh-CN': '实际使用的 OpenAI 模型',
        'en-US': 'Actual OpenAI model used',
      },
    },
    {
      name: 'usage',
      displayName: {
        'zh-CN': '使用统计',
        'en-US': 'Usage Statistics',
      },
      type: 'json',
      description: {
        'zh-CN': 'API 调用的 token 使用统计',
        'en-US': 'Token usage statistics for API call',
      },
    },
    {
      name: 'requestId',
      displayName: {
        'zh-CN': '请求ID',
        'en-US': 'Request ID',
      },
      type: 'string',
      description: {
        'zh-CN': 'OpenAI 返回的请求ID',
        'en-US': 'Request ID returned by OpenAI',
      },
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 5000,
  })
  public async generate(@Body() body: OpenAiRequestDto) {
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

    const result = await this.openAiService.executeRequest(processedBody);

    return {
      code: 200,
      ...result,
    };
  }
} 