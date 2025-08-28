// src/common/schemas/byte-ark.ts

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// 定义字节ARK API内部参数的Zod模式（同时支持文生图和图生图）
export const ByteArkImageParamsSchema = z.object({
  prompt: z.string({
    message: '提示词是必填的，必须是字符串',
  }),
  // 模型参数可选，根据是否提供image参数自动选择合适的默认模型
  model: z.string().optional(),
  // 图片URL改为可选，当不提供时为文生图模式，提供时为图生图模式
  image: z.string().optional(),
  response_format: z.string().optional().default('url'),
  // 尺寸参数可选，不同模式有不同的默认值
  size: z.string().optional(),
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
