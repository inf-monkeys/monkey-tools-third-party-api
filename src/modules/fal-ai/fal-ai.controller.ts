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
import { FalAiRequestDto } from '@/common/schemas/fal-ai';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FalAiService } from './fal-ai.service';

@Controller('fal-ai')
@UseGuards(new AuthGuard())
@ApiTags('Fal AI')
export class FalAiController {
  constructor(private readonly falAiService: FalAiService) {}

  @Post('subscribe')
  @ApiOperation({
    summary: 'Fal AI 端点（订阅模式）',
    description: '调用一个 Fal AI 端点，并使用订阅模式接收结果',
  })
  @MonkeyToolName('fal_ai_endpoint_subscribe')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:🔔:#98ae36')
  @MonkeyToolDisplayName({
    'zh-CN': '调用 Fal AI 端点（订阅模式）',
    'en-US': 'Call Fal AI Endpoint (Subscription Mode)',
  })
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'endpoint',
      displayName: {
        'zh-CN': 'Fal AI 端点',
        'en-US': 'Fal AI Endpoint',
      },
      default: '',
      required: true,
    },
    {
      name: 'input',
      type: 'json',
      displayName: {
        'zh-CN': '输入',
        'en-US': 'Input',
      },
      default: {},
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
        'zh-CN': '结果',
        'en-US': 'Result',
      },
      type: 'json',
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
    estimateTime: 180,
  })
  @MonkeyToolCredentials([
    {
      name: 'fal-ai',
      required: config.fal.apiKey ? false : true,
    },
  ])
  public async subscribe(@Body() body: FalAiRequestDto) {
    return {
      code: 200,
      ...(await this.falAiService.subscribe(body)),
    };
  }
}
