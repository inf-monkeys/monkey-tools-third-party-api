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
      name: 'type',
      displayName: {
        'zh-CN': '请求类型',
        'en-US': 'Request Type',
      },
      default: 'text_to_model',
      description: {
        'zh-CN':
          '可选值: text_to_model, image_to_model, multiview_to_model, texture_model, refine_model',
        'en-US':
          'Available values: text_to_model, image_to_model, multiview_to_model, texture_model, refine_model',
      },
    },
    {
      name: 'input',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      default: {},
      description: {
        'zh-CN': '所有请求参数，如 prompt、file、files 等',
        'en-US': 'All request parameters, such as prompt, file, files, etc.',
      },
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
    // 处理输入参数
    let processedBody: any = { ...body };

    // 使用类型断言处理 input 字段
    const bodyWithInput = body as any;

    // 如果存在 input 字段且为对象，将其内容提取到顶层
    if (bodyWithInput.input && typeof bodyWithInput.input === 'object') {
      // 将 input 中的内容合并到顶层
      const { input, ...restBody } = bodyWithInput;
      processedBody = { ...restBody, ...input };

      // 输出处理后的请求体结构（仅用于调试）
      console.log('处理后的请求体：', JSON.stringify(processedBody, null, 2));
    }

    // 创建任务执行器函数
    const taskExecutor = async () => {
      return this.tripoService.generateModel(processedBody);
    };

    // 执行任务并轮询结果
    const result = await this.tripoService.executeTaskWithPolling(
      taskExecutor,
      processedBody.credential,
    );

    return {
      code: 200,
      ...result,
    };
  }
}
