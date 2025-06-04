import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// 定义 FalAI 请求体的 Zod 模式
export const FalAiRequestSchema = z.object({
  endpoint: z.string({
    required_error: 'API 端点是必填的',
    invalid_type_error: 'API 端点必须是字符串',
  }),
  input: z.any().optional(),
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

// 基于 Zod 模式创建 DTO 类
export class FalAiRequestDto extends createZodDto(FalAiRequestSchema) {}
