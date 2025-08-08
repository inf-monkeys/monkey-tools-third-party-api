import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

// 定义 OpenAI 参数模式
export const OpenAiParamsSchema = z
  .object({
    prompt: z
      .string({
        invalid_type_error: '提示词必须是字符串',
      })
      .describe('文本提示'),
    input_image: z
      .string({
        invalid_type_error: '输入图像必须是URL或Base64编码的字符串',
      })
      .optional()
      .describe('输入图像（URL或Base64）'),
    mask_image: z
      .string({
        invalid_type_error: '遮罩图像必须是URL或Base64编码的字符串',
      })
      .optional()
      .describe('遮罩图像（URL或Base64），用于图像编辑'),
    model: z
      .enum([
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4-vision-preview',
        'gpt-3.5-turbo',
        'gpt-image-1',
      ])
      .default('gpt-4o')
      .describe('使用的模型'),
    max_tokens: z
      .number()
      .min(1)
      .max(4096)
      .default(1000)
      .describe('最大输出token数'),
    temperature: z
      .number()
      .min(0)
      .max(2)
      .default(0.7)
      .describe('温度参数，控制输出的随机性'),
    detail: z
      .enum(['low', 'high', 'auto'])
      .default('auto')
      .describe('图像分析详细程度'),
    system_prompt: z.string().optional().describe('系统提示词'),
    size: z
      .enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'])
      .default('1024x1024')
      .describe('生成图像的尺寸'),
    quality: z
      .enum(['standard', 'hd'])
      .default('standard')
      .describe('图像质量'),
    style: z.enum(['vivid', 'natural']).default('vivid').describe('图像风格'),
    num_images: z.number().min(1).max(10).default(1).describe('生成图像的数量'),
  })
  .passthrough();

// 定义 OpenAI 请求模式
export const OpenAiRequestSchema = z
  .object({
    // 允许通过 input 字段传入参数
    input: z
      .union([
        OpenAiParamsSchema,
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
export class OpenAiRequestDto extends createZodDto(OpenAiRequestSchema) {} 
