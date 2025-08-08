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
import { ByteArkService } from './byte-ark.service';
import { ByteArkImageEditRequestDto } from '@/common/schemas/byte-ark';

@Controller('byte-ark')
@UseGuards(new AuthGuard())
@ApiTags('字节 ARK AI')
export class ByteArkController {
  constructor(private readonly byteArkService: ByteArkService) {}

  @Post('edit-image')
  @ApiOperation({
    summary: '字节 ARK AI 图像生成/编辑',
    description: '使用字节 ARK AI的模型生成或编辑图像（文生图或图生图）',
  })
  @MonkeyToolName('byte_ark_ai_image')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:✏️:#4169e1')
  @MonkeyToolDisplayName({
    'zh-CN': '字节 ARK AI 图像生成/编辑',
    'en-US': 'ByteDance ARK AI Image Generation/Editing',
  })
  @MonkeyToolInput([
    {
      name: 'inputs',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      default: {},
      description: {
        'zh-CN':
          '包含生成图像所需的所有参数，如prompt（必填）、image（可选）、model、size、seed等',
        'en-US':
          'Contains all parameters needed for image generation, such as prompt (required), image (optional), model, size, seed, etc.',
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
      name: 'byte-ark',
      required: config.byteArk?.apiKey ? false : true,
    },
  ])
  async editImage(@Body() body: ByteArkImageEditRequestDto) {
    // 直接使用输入的body，现在body已经包含inputs对象
    return {
      code: 200,
      ...(await this.byteArkService.editImage(body)),
    };
  }
}
