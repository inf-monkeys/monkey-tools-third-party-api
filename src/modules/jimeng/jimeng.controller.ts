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
      description: {
        'zh-CN': '用于生成图像的提示词，支持中英文',
        'en-US': 'Prompt for image generation, supports Chinese and English',
      },
    },
    {
      type: 'json',
      name: 'image',
      displayName: { 'zh-CN': '输入图片', 'en-US': 'Input Image' },
      description: {
        'zh-CN':
          '输入的图片信息，支持 URL 或 Base64 编码。可传入单张图片（字符串）或多张图片（字符串数组，最多10张）',
        'en-US':
          'Input image(s), supports URL or Base64. Can be a single image (string) or multiple images (string array, max 10)',
      },
      required: false,
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
      type: 'number',
      name: 'seed',
      displayName: { 'zh-CN': '随机种子', 'en-US': 'Seed' },
      default: -1,
      description: {
        'zh-CN':
          '随机数种子，用于控制生成内容的随机性。-1 表示使用随机种子，范围: [-1, 2147483647]',
        'en-US':
          'Random seed for controlling generation randomness. -1 means random seed, range: [-1, 2147483647]',
      },
      required: false,
    },
    {
      type: 'string',
      name: 'sequential_image_generation',
      displayName: { 'zh-CN': '组图模式', 'en-US': 'Sequential Generation' },
      default: 'disabled',
      description: {
        'zh-CN':
          '组图功能控制。auto: 自动判断是否返回组图，disabled: 只生成一张图',
        'en-US':
          'Sequential image generation control. auto: auto-determine, disabled: single image only',
      },
      required: false,
    },
    {
      type: 'json',
      name: 'sequential_image_generation_options',
      displayName: { 'zh-CN': '组图配置', 'en-US': 'Sequential Options' },
      description: {
        'zh-CN':
          '组图功能的配置，例如: {"max_images": 3}。仅当组图模式为 auto 时生效',
        'en-US':
          'Sequential generation options, e.g., {"max_images": 3}. Only effective when mode is auto',
      },
      required: false,
    },
    {
      type: 'number',
      name: 'guidance_scale',
      displayName: { 'zh-CN': '文本权重', 'en-US': 'Guidance Scale' },
      description: {
        'zh-CN':
          '模型输出结果与提示词的一致程度，值越大与提示词相关性越强。范围: [1, 10]',
        'en-US':
          'Guidance scale for prompt adherence. Higher values = stronger correlation. Range: [1, 10]',
      },
      required: false,
    },
    {
      type: 'string',
      name: 'response_format',
      displayName: { 'zh-CN': '返回格式', 'en-US': 'Response Format' },
      default: 'url',
      description: {
        'zh-CN':
          '生成图像的返回格式。url: 返回图片链接，b64_json: 返回Base64编码',
        'en-US':
          'Response format. url: returns image URL, b64_json: returns Base64 encoded data',
      },
      required: false,
    },
    {
      type: 'boolean',
      name: 'watermark',
      displayName: { 'zh-CN': '水印', 'en-US': 'Watermark' },
      default: true,
      description: {
        'zh-CN': '是否在生成的图片中添加"AI生成"水印',
        'en-US': 'Whether to add "AI Generated" watermark to images',
      },
    },
    {
      type: 'boolean',
      name: 'stream',
      displayName: { 'zh-CN': '流式传输', 'en-US': 'Stream' },
      default: false,
      description: {
        'zh-CN': '是否开启流式输出模式',
        'en-US': 'Whether to enable streaming output mode',
      },
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
