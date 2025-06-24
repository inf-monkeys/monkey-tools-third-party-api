import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// 定义 BFL AI 请求体的 Zod 模式
export const BflAiRequestSchema = z.object({
  prompt: z.string({
    required_error: '提示词是必填的',
    invalid_type_error: '提示词必须是字符串',
  }),
  input_image: z.string({
    required_error: '输入图像是必填的',
    invalid_type_error: '输入图像必须是 base64 编码的字符串',
  }).describe('输入图像的 base64 编码'),
  seed: z.number().optional().describe('随机种子'),
  aspect_ratio: z.string().optional().describe('图像宽高比'),
  output_format: z.string().default('jpeg').describe('输出格式'),
  webhook_url: z.string().optional().describe('回调 URL'),
  webhook_secret: z.string().optional().describe('回调密钥'),
  prompt_upsampling: z.boolean().default(false).describe('是否进行提示上采样'),
  safety_tolerance: z.number().default(2).describe('安全检查级别'),
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

// 基于 Zod 模式创建 DTO 类
export class BflAiRequestDto extends createZodDto(BflAiRequestSchema) {}
