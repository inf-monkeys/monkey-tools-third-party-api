import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const GoogleSearchParamsSchema = z.object({
  q: z.string({
    message: '搜索查询关键词是必填的，必须是字符串',
  }),
  gl: z.string().optional().default('us'),
  hl: z.string().optional().default('en'),
  type: z.string().optional().default('search'),
  num: z.number().optional(),
});

export const GoogleSearchRequestSchema = z.object({
  inputs: GoogleSearchParamsSchema,
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

export class GoogleSearchRequestDto extends createZodDto(
  GoogleSearchRequestSchema,
) {}
