import { config } from '@/common/config';
import {
  MonkeyToolCategories,
  MonkeyToolCredentials,
  MonkeyToolDisplayName,
  MonkeyToolExtra,
  MonkeyToolIcon,
  MonkeyToolInput,
  MonkeyToolName,
  MonkeyToolOutput,
} from '@/common/decorators/monkey-block-api-extensions.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { BflAiRequestDto } from '@/common/schemas/bfl-ai';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BflAiService } from './bfl-ai.service';

@Controller('bfl-ai')
@UseGuards(new AuthGuard())
@ApiTags('BFL AI')
export class BflAiController {
  constructor(private readonly bflAiService: BflAiService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'BFL AI 图像生成（带轮询）',
    description: '调用 BFL AI 的图像生成接口，并轮询等待结果',
  })
  @MonkeyToolName('bfl_ai_image_generate')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:🖼️:#3678ae')
  @MonkeyToolDisplayName({
    'zh-CN': '调用 BFL AI 图像生成',
    'en-US': 'Call BFL AI Image Generation',
  })
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'prompt',
      displayName: {
        'zh-CN': '提示词',
        'en-US': 'Prompt',
      },
      default: '',
      required: true,
    },
    {
      name: 'input_image',
      type: 'string',
      displayName: {
        'zh-CN': '输入图像',
        'en-US': 'Input Image',
      },
      description: {
        'zh-CN': '输入图像的 base64 编码',
        'en-US': 'Base64 encoded input image',
      },
      required: true,
    },
    {
      name: 'seed',
      type: 'number',
      displayName: {
        'zh-CN': '随机种子',
        'en-US': 'Seed',
      },
      default: null,
      required: false,
    },
    {
      name: 'aspect_ratio',
      type: 'string',
      displayName: {
        'zh-CN': '宽高比',
        'en-US': 'Aspect Ratio',
      },
      default: null,
      required: false,
    },
    {
      name: 'output_format',
      type: 'string',
      displayName: {
        'zh-CN': '输出格式',
        'en-US': 'Output Format',
      },
      default: 'jpeg',
      required: false,
    },
    {
      name: 'safety_tolerance',
      type: 'number',
      displayName: {
        'zh-CN': '安全检查级别',
        'en-US': 'Safety Tolerance',
      },
      default: 2,
      required: false,
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
      name: 'requestId',
      displayName: {
        'zh-CN': '请求 ID',
        'en-US': 'Request ID',
      },
      type: 'string',
    },
    {
      name: 'status',
      displayName: {
        'zh-CN': '状态',
        'en-US': 'Status',
      },
      type: 'string',
    },
    {
      name: 'images',
      displayName: {
        'zh-CN': '图像结果',
        'en-US': 'Image Results',
      },
      type: 'json',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 300,
  })
  @MonkeyToolCredentials([
    {
      name: 'bfl-ai',
      required: config.bfl?.apiKey ? false : true,
    },
  ])
  public async generate(@Body() body: BflAiRequestDto) {
    const result = await this.bflAiService.executeRequestWithPolling(
      () => this.bflAiService.submitRequest(body),
      body.credential,
    );
    return {
      code: 200,
      ...result,
    };
  }
}
