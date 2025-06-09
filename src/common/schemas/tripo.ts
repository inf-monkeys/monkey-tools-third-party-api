import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// 定义文件对象的 Zod 模式
const FileSchema = z.object({
  type: z.string().optional(),
  file_token: z.string().optional(),
  url: z.string().optional(),
  // STS 上传相关字段
  object: z.object({
    bucket: z.string().optional(),
    key: z.string().optional()
  }).optional()
});

// 定义 Tripo 请求体的 Zod 模式
export const TripoRequestSchema = z.object({
  // 请求类型，如 text_to_model, image_to_model, multiview_to_model, texture_model, refine_model 等
  type: z.enum([
    'text_to_model', 
    'image_to_model', 
    'multiview_to_model', 
    'texture_model', 
    'refine_model'
  ]).default('text_to_model'),
  
  // 文本到模型所需字段
  prompt: z.string().optional(),
  
  // 图像到模型所需字段
  file: z.object({
    type: z.string().optional(),
    file_token: z.string().optional(),
    url: z.string().optional(),
    object: z.object({
      bucket: z.string().optional(),
      key: z.string().optional()
    }).optional()
  }).optional(),
  
  // 多视图到模型所需字段
  files: z.array(FileSchema).optional(),
  
  // texture_model 和 refine_model 所需字段
  original_model_task_id: z.string().optional(),
  draft_model_task_id: z.string().optional(),
  
  // 通用可选字段
  style: z.string().optional(),
  model_version: z.string().optional(),
  negative_prompt: z.string().optional(),
  image_seed: z.number().optional(),
  model_seed: z.number().optional(),
  face_limit: z.number().optional(),
  texture: z.boolean().optional(),
  pbr: z.boolean().optional(),
  texture_seed: z.number().optional(),
  texture_quality: z.string().optional(),
  texture_alignment: z.enum(['original_image', 'geometry']).optional(),
  auto_size: z.boolean().optional(),
  orientation: z.enum(['align_image', 'default']).optional(),
  quad: z.boolean().optional(),
  
  // 凭证信息
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
  
  // 直接提供 API 密钥
  apiKey: z.string().optional(),
});

// 基于 Zod 模式创建 DTO 类
export class TripoRequestDto extends createZodDto(TripoRequestSchema) {}
