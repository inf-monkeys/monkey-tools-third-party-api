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
import { TripoRequestDto } from '@/common/schemas/tripo';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TripoService } from './tripo.service';

@Controller('tripo')
@UseGuards(new AuthGuard())
@ApiTags('Tripo 3D')
export class TripoController {
  constructor(private readonly tripoService: TripoService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Tripo 3D 模型生成（自动轮询）',
    description: '通过文本描述生成 3D 模型，自动轮询直到任务完成',
  })
  @MonkeyToolName('tripo_3d_generate')
  @MonkeyToolCategories(['3d', 'ai'])
  @MonkeyToolIcon('emoji:🧊:#c5e8ef')
  @MonkeyToolDisplayName({
    'zh-CN': 'Tripo 3D 模型生成',
    'en-US': 'Tripo 3D Model Generation',
  })
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'prompt',
      displayName: {
        'zh-CN': '文本描述',
        'en-US': 'Text Description',
      },
      default: '',
      required: true,
    },
    {
      name: 'style',
      type: 'string',
      displayName: {
        'zh-CN': '风格',
        'en-US': 'Style',
      },
      default: '',
    },
    {
      name: 'model_version',
      type: 'string',
      displayName: {
        'zh-CN': '模型版本',
        'en-US': 'Model Version',
      },
      default: '',
    },
    {
      name: 'negative_prompt',
      type: 'string',
      displayName: {
        'zh-CN': '负面提示词',
        'en-US': 'Negative Prompt',
      },
      default: '',
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
      name: 'taskId',
      displayName: {
        'zh-CN': '任务ID',
        'en-US': 'Task ID',
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
      name: 'progress',
      displayName: {
        'zh-CN': '进度',
        'en-US': 'Progress',
      },
      type: 'number',
    },
    {
      name: 'output',
      displayName: {
        'zh-CN': '输出',
        'en-US': 'Output',
      },
      type: 'json',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 180,
  })
  @MonkeyToolCredentials([
    {
      name: 'tripo-api',
      required: config.tripo?.apiKey ? false : true,
    },
  ])
  public async generate(@Body() body: TripoRequestDto) {
    // 创建任务执行器函数
    const taskExecutor = async () => {
      return this.tripoService.generateModel(body);
    };
    
    // 执行任务并轮询结果
    const result = await this.tripoService.executeTaskWithPolling(taskExecutor, body.credential);
    
    return {
      code: 200,
      ...result,
    };
  }
}
