// src/common/schemas/jimeng.ts

import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// 定义即梦 AI 请求体的 Zod 模式
export const JimengGenerateRequestSchema = z.object({
  prompt: z.string({
    required_error: '提示词是必填的',
    invalid_type_error: '提示词必须是字符串',
  }),
  model: z.string().optional().describe('模型版本，默认为 jimeng-2.0-pro'),
  negativePrompt: z.string().optional().default(''),
  width: z
    .number({
      invalid_type_error: '宽度必须是数字',
    })
    .optional()
    .default(1024),
  height: z
    .number({
      invalid_type_error: '高度必须是数字',
    })
    .optional()
    .default(1024),
  sampleStrength: z
    .number({
      invalid_type_error: '采样强度必须是数字',
    })
    .optional()
    .default(0.5),
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

// 基于 Zod 模式创建 DTO 类
export class JimengGenerateRequestDto extends createZodDto(
  JimengGenerateRequestSchema,
) {}
