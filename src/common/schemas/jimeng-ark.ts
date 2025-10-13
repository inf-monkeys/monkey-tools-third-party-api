import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const JimengArkGenerateRequestSchema = z.object({
  prompt: z.string({ message: 'prompt 为必填字符串' }),
  size: z.enum(['1K', '2K', '4K']).optional().default('2K'),
  watermark: z.boolean().optional().default(true),
  stream: z.boolean().optional().default(false),
  credential: z
    .object({
      type: z.string().optional(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息，包含 api_key 或 apiKey'),
});

export class JimengArkGenerateRequestDto extends createZodDto(
  JimengArkGenerateRequestSchema,
) {}
