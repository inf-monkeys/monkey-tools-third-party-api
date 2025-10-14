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
import { JimengArkGenerateRequestDto } from '@/common/schemas/jimeng-ark';
import { JimengArkService } from './jimeng.ark.service';

@Controller('jimeng')
@UseGuards(new AuthGuard())
@ApiTags('即梦 AI')
export class JimengController {
  constructor(private readonly jimengArkService: JimengArkService) {}

  @Post('ark/generate')
  @ApiOperation({
    summary: '即梦 Ark 生成图片',
    description:
      '调用豆包 Ark 平台的即梦 4.0 图像生成 API (doubao-seedream-4-0-250828)',
  })
  @MonkeyToolName('jimeng_ark_generate')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:🎨:#e74c3c')
  @MonkeyToolDisplayName({
    'zh-CN': '即梦 Ark 生成',
    'en-US': 'Jimeng Ark Generate',
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
        'zh-CN':
          '包含提示词、图片、尺寸等参数的JSON对象。例如: {"prompt": "一只可爱的猫咪", "image": "图片URL或Base64", "size": "2K"}',
        'en-US':
          'JSON object containing prompt, image, size and other parameters. Example: {"prompt": "a cute cat", "image": "image URL or Base64", "size": "2K"}',
      },
      default: {
        prompt: '一只可爱的猫咪',
        image: '',
        size: '2K',
        seed: -1,
        sequential_image_generation: 'disabled',
        response_format: 'url',
        watermark: true,
        stream: false,
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'code',
      type: 'number',
      displayName: { 'zh-CN': '状态码', 'en-US': 'Status Code' },
    },
    {
      name: 'data',
      type: 'json',
      displayName: { 'zh-CN': '返回数据', 'en-US': 'Response Data' },
    },
    {
      name: 'requestId',
      type: 'string',
      displayName: { 'zh-CN': '请求ID', 'en-US': 'Request ID' },
    },
  ])
  @MonkeyToolExtra({ estimateTime: 10 })
  @MonkeyToolCredentials([
    { name: 'byte-ark', required: !config.byteArk?.apiKey },
  ])
  async arkGenerate(@Body() body: JimengArkGenerateRequestDto) {
    // 处理输入参数：如果存在 input 字段，将其内容提取到顶层
    let processedBody: any = { ...body };

    if (body.input && typeof body.input === 'object') {
      const { input, ...restBody } = body;
      processedBody = { ...restBody, ...input };
      console.log(
        '处理 input 对象后的请求体：',
        JSON.stringify(processedBody, null, 2),
      );
    }

    const out = await this.jimengArkService.generate(processedBody);
    return { code: 200, ...out };
  }
}
