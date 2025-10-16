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
    // 支持单图或多图
    input_image: z
      .union([
        z.string({ message: '输入图像必须是URL或Base64编码的字符串' }),
        z.array(z.string(), {
          message: '输入图像必须是由URL或Base64字符串组成的数组',
        }),
      ])
      .optional()
      .describe('输入图像（URL或Base64，支持单个或数组）'),
    // 兼容 input_images 字段
    input_images: z
      .array(z.string())
      .optional()
      .describe('输入图像数组（URL或Base64）'),
    // 宽高比配置（仅 Gemini 2.5 Flash Image 支持）
    aspect_ratio: z
      .enum([
        '1:1',
        '2:3',
        '3:2',
        '3:4',
        '4:3',
        '4:5',
        '5:4',
        '9:16',
        '16:9',
        '21:9',
      ])
      .optional()
      .describe('图像宽高比（默认为 1:1 或与输入图片一致）'),
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
        type: z.string().optional(),
        encryptedData: z.string().optional(),
        apiKey: z.string().optional(),
        api_key: z.string().optional(),
      })
      .passthrough()
      .optional()
      .describe('凭证信息'),
  })
  .passthrough();

// 创建 DTO 类
export class GeminiAiRequestDto extends createZodDto(GeminiAiRequestSchema) {}
