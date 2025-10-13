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
// legacy jimeng-free removed
import {
  JimengV4SubmitRequestDto,
  JimengV4GetResultRequestDto,
} from '@/common/schemas/jimeng-v4';
import { JimengArkGenerateRequestDto } from '@/common/schemas/jimeng-ark';
import { JimengV4Service } from './jimeng.v4.service';
import { JimengArkService } from './jimeng.ark.service';

@Controller('jimeng')
@UseGuards(new AuthGuard())
@ApiTags('即梦 AI')
export class JimengController {
  constructor(
    private readonly jimengV4Service: JimengV4Service,
    private readonly jimengArkService: JimengArkService,
  ) {}

  // legacy generate endpoint removed

  @Post('v4/submit')
  @ApiOperation({
    summary: '即梦4.0 提交任务',
    description: '调用火山引擎 Visual 异步提交任务 (CVSync2AsyncSubmitTask)',
  })
  @MonkeyToolName('jimeng_v4_submit')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:🚀:#2e86de')
  @MonkeyToolDisplayName({
    'zh-CN': '即梦4.0 提交任务',
    'en-US': 'Jimeng v4 Submit Task',
  })
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'prompt',
      required: true,
      displayName: { 'zh-CN': '提示词', 'en-US': 'Prompt' },
    },
    {
      type: 'json',
      name: 'imageUrls',
      displayName: { 'zh-CN': '参考图URL数组', 'en-US': 'Image URL Array' },
      default: [],
      description: {
        'zh-CN': '可选，最多10张；示例：["https://..."]',
        'en-US': 'Optional up to 10; e.g. ["https://..."]',
      },
    },
    {
      type: 'number',
      name: 'size',
      displayName: { 'zh-CN': '面积', 'en-US': 'Size (area)' },
    },
    {
      type: 'number',
      name: 'width',
      displayName: { 'zh-CN': '宽', 'en-US': 'Width' },
    },
    {
      type: 'number',
      name: 'height',
      displayName: { 'zh-CN': '高', 'en-US': 'Height' },
    },
    {
      type: 'number',
      name: 'scale',
      displayName: { 'zh-CN': '文本影响程度', 'en-US': 'Scale' },
      default: 0.5,
    },
    {
      type: 'boolean',
      name: 'forceSingle',
      displayName: { 'zh-CN': '强制单图', 'en-US': 'Force Single' },
      default: false,
    },
    {
      type: 'number',
      name: 'minRatio',
      displayName: { 'zh-CN': '最小宽高比', 'en-US': 'Min Ratio' },
      default: 1 / 3,
    },
    {
      type: 'number',
      name: 'maxRatio',
      displayName: { 'zh-CN': '最大宽高比', 'en-US': 'Max Ratio' },
      default: 3,
    },
    {
      type: 'number',
      name: 'seed',
      displayName: { 'zh-CN': '随机种子', 'en-US': 'Seed' },
      default: -1,
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
  @MonkeyToolExtra({ estimateTime: 5 })
  @MonkeyToolCredentials([
    {
      name: 'volc-visual',
      required: !!!(
        config.volcVisual?.accessKeyId && config.volcVisual?.secretAccessKey
      ),
    },
  ])
  async v4Submit(@Body() body: JimengV4SubmitRequestDto) {
    // Support imageUrls passed as string JSON via body.imageUrls if needed by UI
    if (typeof (body as any).imageUrls === 'string') {
      try {
        (body as any).imageUrls = JSON.parse((body as any).imageUrls);
      } catch {}
    }
    const out = await this.jimengV4Service.submitTask(body);
    return { code: 200, ...out };
  }

  @Post('v4/result')
  @ApiOperation({
    summary: '即梦4.0 查询结果',
    description: '调用火山引擎 Visual 查询任务结果 (CVSync2AsyncGetResult)',
  })
  @MonkeyToolName('jimeng_v4_get_result')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:📥:#27ae60')
  @MonkeyToolDisplayName({
    'zh-CN': '即梦4.0 查询结果',
    'en-US': 'Jimeng v4 Get Result',
  })
  @MonkeyToolInput([
    {
      type: 'string',
      name: 'taskId',
      required: true,
      displayName: { 'zh-CN': '任务ID', 'en-US': 'Task ID' },
    },
    {
      type: 'string',
      name: 'reqJson',
      displayName: { 'zh-CN': '配置JSON字符串', 'en-US': 'Req JSON String' },
      description: {
        'zh-CN': '用于如 return_url、logo_info 等',
        'en-US': 'For options like return_url, logo_info',
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
  @MonkeyToolExtra({ estimateTime: 30 })
  @MonkeyToolCredentials([
    {
      name: 'volc-visual',
      required: !!!(
        config.volcVisual?.accessKeyId && config.volcVisual?.secretAccessKey
      ),
    },
  ])
  async v4GetResult(@Body() body: JimengV4GetResultRequestDto) {
    const out = await this.jimengV4Service.getResult(body);
    return { code: 200, ...out };
  }

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
