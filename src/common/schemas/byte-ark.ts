// src/common/schemas/byte-ark.ts

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// 定义字节ARK API内部参数的Zod模式（同时支持文生图和图生图）
export const ByteArkImageParamsSchema = z.object({
  prompt: z.string({
    required_error: '提示词是必填的',
    invalid_type_error: '提示词必须是字符串',
  }),
  // 模型参数必填
  model: z.string({
    required_error: '模型参数是必填的',
    invalid_type_error: '模型参数必须是字符串',
  }),
  // 图片URL改为可选，当不提供时为文生图模式，提供时为图生图模式
  image: z.string().optional(),
  response_format: z.string().optional().default('url'),
  // 尺寸参数必填
  size: z.string({
    required_error: '图像尺寸参数是必填的',
    invalid_type_error: '图像尺寸参数必须是字符串',
  }),
  seed: z.number().optional(),
  guidance_scale: z.number().optional(),
  watermark: z.boolean().optional().default(true),
  // 可以添加文生图特有的参数
  negative_prompt: z.string().optional(),
});

// 定义字节ARK API请求体的Zod模式，使用inputs对象包装所有参数
export const ByteArkImageEditRequestSchema = z.object({
  inputs: ByteArkImageParamsSchema,
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

// 基于Zod模式创建DTO类
export class ByteArkImageEditRequestDto extends createZodDto(
  ByteArkImageEditRequestSchema,
) {}
