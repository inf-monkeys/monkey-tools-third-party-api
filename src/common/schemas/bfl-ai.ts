import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// 定义单个参数的 Zod 模式
const BflAiParamsSchema = z
  .object({
    prompt: z
      .string({
        message: '提示词必须是字符串',
      })
      .optional(),
    input_image: z
      .string({
        message: '输入图像必须是 base64 编码的字符串',
      })
      .optional()
      .describe('输入图像的 base64 编码'),
    seed: z.number().optional().describe('随机种子'),
    aspect_ratio: z.string().optional().describe('图像宽高比'),
    output_format: z.string().optional().default('jpeg').describe('输出格式'),
    webhook_url: z.string().optional().describe('回调 URL'),
    webhook_secret: z.string().optional().describe('回调密钥'),
    prompt_upsampling: z
      .boolean()
      .optional()
      .default(false)
      .describe('是否进行提示上采样'),
    safety_tolerance: z.number().optional().default(2).describe('安全检查级别'),
  })
  .passthrough();

// 定义 BFL AI 请求体的 Zod 模式
export const BflAiRequestSchema = z
  .object({
    // 支持两种方式：直接传参数或通过 input 字段传参数
    input: z
      .union([BflAiParamsSchema, z.record(z.string(), z.any())])
      .optional()
      .describe('输入参数，包含提示词、输入图像等'),

    // 以下字段也可以直接在顶层传入
    prompt: z.string().optional(),
    input_image: z.string().optional(),
    seed: z.number().optional(),
    aspect_ratio: z.string().optional(),
    output_format: z.string().optional(),
    safety_tolerance: z.number().optional(),

    credential: z
      .object({
        type: z.string(),
        encryptedData: z.string(),
      })
      .optional()
      .describe('凭证信息'),
  })
  .passthrough();

// 基于 Zod 模式创建 DTO 类
export class BflAiRequestDto extends createZodDto(BflAiRequestSchema) {}
