import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

export const JimengArkGenerateRequestSchema = z.object({
  prompt: z.string({ message: 'prompt 为必填字符串' }),
  image: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe(
      '输入的图片信息，支持 URL 或 Base64 编码。支持单图或多图输入（最多10张）',
    ),
  size: z.enum(['1K', '2K', '4K']).optional().default('2K'),
  seed: z
    .number()
    .int()
    .min(-1)
    .max(2147483647)
    .optional()
    .default(-1)
    .describe('随机数种子，用于控制生成内容的随机性。-1 表示使用随机种子'),
  sequential_image_generation: z
    .enum(['auto', 'disabled'])
    .optional()
    .default('disabled')
    .describe('组图功能控制：auto-自动判断是否返回组图，disabled-只生成一张图'),
  sequential_image_generation_options: z
    .object({
      max_images: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe('组图模式下生成的最大图片数量'),
    })
    .optional()
    .describe(
      '组图功能的配置，仅当 sequential_image_generation 为 auto 时生效',
    ),
  guidance_scale: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe(
      '模型输出结果与 prompt 的一致程度（文本权重），值越大与提示词相关性越强',
    ),
  response_format: z
    .enum(['url', 'b64_json'])
    .optional()
    .default('url')
    .describe('生成图像的返回格式：url-返回图片链接，b64_json-返回Base64编码'),
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
