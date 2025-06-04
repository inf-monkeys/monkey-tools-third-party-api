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
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JimengService } from './jimeng.service';
import { JimengGenerateRequestDto } from '@/common/schemas/jimeng';

@Controller('jimeng')
@UseGuards(new AuthGuard())
@ApiTags('即梦 AI')
export class JimengController {
  constructor(private readonly jimengService: JimengService) {}

  @Post('generate')
  @ApiOperation({
    summary: '即梦 AI 图像生成',
    description: '使用即梦 AI 生成图像',
  })
  @MonkeyToolName('jimeng_ai_generate')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:🎨:#ff7f50')
  @MonkeyToolDisplayName({
    'zh-CN': '即梦 AI 图像生成',
    'en-US': 'Jimeng AI Image Generation',
  })
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'prompt',
      displayName: {
        'zh-CN': '提示词',
        'en-US': 'Prompt',
      },
      required: true,
    },
    {
      type: 'string',
      name: 'negativePrompt',
      displayName: {
        'zh-CN': '反向提示词',
        'en-US': 'Negative Prompt',
      },
      default: '',
    },
    {
      type: 'number',
      name: 'width',
      displayName: {
        'zh-CN': '宽度',
        'en-US': 'Width',
      },
      default: 1024,
    },
    {
      type: 'number',
      name: 'height',
      displayName: {
        'zh-CN': '高度',
        'en-US': 'Height',
      },
      default: 1024,
    },
    {
      type: 'number',
      name: 'sampleStrength',
      displayName: {
        'zh-CN': '采样强度',
        'en-US': 'Sample Strength',
      },
      default: 0.5,
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
      name: 'data',
      displayName: {
        'zh-CN': '生成结果',
        'en-US': 'Generated Results',
      },
      type: 'json',
      description: {
        'zh-CN':
          "生成成功后，返回的 data 包含 created: number 和 data: Record<'url', string>[]",
        'en-US':
          "After successful generation, the returned data contains created: number and data: Record<'url', string>[]",
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
  ])
  @MonkeyToolExtra({
    estimateTime: 30,
  })
  @MonkeyToolCredentials([
    {
      name: 'jimeng',
      required: config.jimeng?.apiKey ? false : true,
    },
  ])
  async generate(@Body() body: JimengGenerateRequestDto) {
    return {
      code: 200,
      ...(await this.jimengService.generateImage(body)),
    };
  }
}
