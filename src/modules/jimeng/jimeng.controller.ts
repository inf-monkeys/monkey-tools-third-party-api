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
      type: 'string',
      name: 'prompt',
      required: true,
      displayName: { 'zh-CN': '提示词', 'en-US': 'Prompt' },
    },
    {
      type: 'string',
      name: 'size',
      displayName: { 'zh-CN': '尺寸', 'en-US': 'Size' },
      default: '2K',
      description: {
        'zh-CN': '可选: 1K, 2K, 4K',
        'en-US': 'Options: 1K, 2K, 4K',
      },
    },
    {
      type: 'boolean',
      name: 'watermark',
      displayName: { 'zh-CN': '水印', 'en-US': 'Watermark' },
      default: true,
    },
    {
      type: 'boolean',
      name: 'stream',
      displayName: { 'zh-CN': '流式传输', 'en-US': 'Stream' },
      default: false,
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
    const out = await this.jimengArkService.generate(body);
    return { code: 200, ...out };
  }
}
