import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const JimengV4SubmitRequestSchema = z.object({
  prompt: z.string({ message: 'prompt 为必填字符串' }),
  imageUrls: z.array(z.string()).max(10).optional(),
  size: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  scale: z.number().min(0).max(1).optional().default(0.5),
  forceSingle: z.boolean().optional(),
  minRatio: z.number().positive().optional(),
  maxRatio: z.number().positive().optional(),
  seed: z.number().int().optional(),
  credential: z
    .object({
      type: z.string().optional(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息，包含 access_key_id 与 secret_access_key'),
});

export class JimengV4SubmitRequestDto extends createZodDto(
  JimengV4SubmitRequestSchema,
) {}

export const JimengV4GetResultRequestSchema = z.object({
  taskId: z.string({ message: 'taskId 为必填字符串' }),
  reqJson: z.string().optional().describe('序列化后的配置 JSON 字符串'),
  credential: z
    .object({
      type: z.string().optional(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息，包含 access_key_id 与 secret_access_key'),
});

export class JimengV4GetResultRequestDto extends createZodDto(
  JimengV4GetResultRequestSchema,
) {}
