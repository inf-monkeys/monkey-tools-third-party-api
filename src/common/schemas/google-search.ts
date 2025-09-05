import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

export const GoogleSearchParamsSchema = z.object({
  query: z.string({
    message: '搜索关键词是必填的，必须是字符串',
  }),
  searchType: z
    .enum(['search', 'shopping', 'images', 'news'])
    .optional()
    .default('search'),
  country: z.string().optional().default('us'),
  language: z.string().optional().default('en'),
  resultCount: z.number().min(1).max(100).optional().default(10),
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
