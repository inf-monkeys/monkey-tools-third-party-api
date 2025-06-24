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
      name: 'input',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN': '包含提示词、输入图像等参数的JSON对象',
        'en-US': 'JSON object containing prompt, input image and other parameters',
      },
      default: {
        prompt: '',
        input_image: '',
        seed: null,
        aspect_ratio: null,
        output_format: 'jpeg',
        safety_tolerance: 2
      },
      required: true,
    }
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
      name: 'bfl',
      required: config.bfl?.apiKey ? false : true,
    },
  ])
  public async generate(@Body() body: BflAiRequestDto) {
    // 处理输入参数
    let processedBody: any = { ...body };
    
    // 如果存在 input 字段，将其内容提取到顶层
    if (body.input && typeof body.input === 'object') {
      const { input, ...restBody } = body;
      processedBody = { ...restBody, ...input };
      this.bflAiService.logger.log('处理 input 对象后的请求体：', JSON.stringify(processedBody, null, 2));
    }
    
    const result = await this.bflAiService.executeRequestWithPolling(
      () => this.bflAiService.submitRequest(processedBody),
      processedBody.credential,
    );
    return {
      code: 200,
      ...result,
    };
  }
}
