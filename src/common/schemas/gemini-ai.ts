import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

// 定义 Gemini AI 参数模式
export const GeminiAiParamsSchema = z
  .object({
    prompt: z
      .string({
        message: '提示词必须是字符串',
      })
      .optional()
      .describe('文本提示'),
    input_image: z
      .string({
        message: '输入图像必须是URL或Base64编码的字符串',
      })
      .optional()
      .describe('输入图像（URL或Base64）'),
  })
  .passthrough();

// 定义 Gemini AI 请求模式
export const GeminiAiRequestSchema = z
  .object({
    // 允许通过 input 字段传入参数
    input: z
      .union([
        GeminiAiParamsSchema,
        z.string().transform((str) => {
          try {
            return JSON.parse(str);
          } catch (e) {
            return { prompt: str };
          }
        }),
      ])
      .optional()
      .describe('输入参数，包含提示词、输入图像等'),

    // 凭证
    credential: z
      .object({
        type: z.string(),
        encryptedData: z.string(),
      })
      .optional()
      .describe('凭证信息'),
  })
  .passthrough();

// 创建 DTO 类
export class GeminiAiRequestDto extends createZodDto(GeminiAiRequestSchema) {}
