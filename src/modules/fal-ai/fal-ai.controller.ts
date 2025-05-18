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
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FalAiService } from './fal-ai.service';

@Controller('fal-ai')
// @UseGuards(new AuthGuard())
@ApiTags('Fal AI')
export class FalAiController {
  constructor(private readonly falAiService: FalAiService) {}

  @Post('subscribe')
  @ApiOperation({
    summary: '调用 API 端点（订阅模式）',
    description: '调用一个 API 端点，并使用订阅模式接收结果',
  })
  @MonkeyToolName('fal-ai-endpoint-subscribe')
  @MonkeyToolCategories(['fal-ai'])
  @MonkeyToolIcon('emoji:🔔:#98ae36')
  @MonkeyToolDisplayName({
    'zh-CN': '调用 API 端点（订阅模式）',
    'en-US': 'Call API Endpoint (Subscription Mode)',
  })
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'endpoint',
      displayName: {
        'zh-CN': 'API 端点',
        'en-US': 'API Endpoint',
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
    {
      name: 'apiKey',
      type: 'string',
      displayName: {
        'zh-CN': '指定 API Key',
        'en-US': 'Specify API Key',
      },
      description: {
        'zh-CN': '默认为团队或租户级别配置 key',
        'en-US': 'Default to the team or tenant level configured key',
      },
      default: '',
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'result',
      displayName: {
        'zh-CN': '结果',
        'en-US': 'Result',
      },
      type: 'json',
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
  public async subscribe(
    @Body() body: FalAiRequestDto,
  ) {
    console.log(body);
    
    const result = await this.falAiService.subscribe(body.endpoint, body.input, body.apiKey);
    return {
      result,
    };
  }
}
