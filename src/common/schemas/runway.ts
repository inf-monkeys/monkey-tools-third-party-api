import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

// 图片到视频生成参数
export const ImageToVideoParamsSchema = z.object({
  promptImage: z
    .string({
      message: '图片URL是必填的，必须是字符串',
    })
    .describe('图片URL，支持HTTPS URL或data URI'),
  promptText: z
    .string()
    .optional()
    .describe('描述视频内容的文本提示，最多1000字符'),
  model: z.enum(['gen4_turbo', 'gen3a_turbo']).describe('生成模型'),
  ratio: z
    .string({
      message: '分辨率比例是必填的，必须是字符串',
    })
    .describe('视频分辨率比例'),
  duration: z
    .number()
    .int()
    .min(5)
    .max(10)
    .optional()
    .default(10)
    .describe('视频时长(秒)'),
  seed: z.number().int().min(0).max(4294967295).optional().describe('随机种子'),
  contentModeration: z
    .object({
      publicFigureThreshold: z.enum(['auto', 'low']).optional().default('auto'),
    })
    .optional()
    .describe('内容审核设置'),
});

// 视频到视频生成参数
export const VideoToVideoParamsSchema = z.object({
  videoUri: z
    .string({
      message: '视频URL是必填的，必须是字符串',
    })
    .describe('视频URL，支持HTTPS URL或data URI'),
  promptText: z
    .string({
      message: '文本提示是必填的，必须是字符串',
    })
    .max(1000, '文本提示不能超过1000字符')
    .describe('描述输出视频的文本提示'),
  model: z.literal('gen4_aleph').describe('模型类型，固定为gen4_aleph'),
  ratio: z
    .enum([
      '1280:720',
      '720:1280',
      '1104:832',
      '960:960',
      '832:1104',
      '1584:672',
      '848:480',
      '640:480',
    ])
    .describe('视频分辨率比例'),
  seed: z.number().int().min(0).max(4294967295).optional().describe('随机种子'),
  references: z
    .array(
      z.object({
        type: z.literal('image'),
        uri: z.string().describe('参考图片URL'),
      }),
    )
    .optional()
    .describe('参考图片列表'),
  contentModeration: z
    .object({
      publicFigureThreshold: z.enum(['auto', 'low']).optional().default('auto'),
    })
    .optional()
    .describe('内容审核设置'),
});

// 文本到图像生成参数
export const TextToImageParamsSchema = z.object({
  promptText: z
    .string({
      message: '文本提示是必填的，必须是字符串',
    })
    .max(1000, '文本提示不能超过1000字符')
    .describe('描述图像内容的文本提示'),
  model: z.enum(['gen4_image', 'gen4_image_turbo']).describe('生成模型'),
  ratio: z
    .enum([
      '1920:1080',
      '1080:1920',
      '1024:1024',
      '1360:768',
      '1080:1080',
      '1168:880',
      '1440:1080',
      '1080:1440',
      '1808:768',
      '2112:912',
      '1280:720',
      '720:1280',
      '720:720',
      '960:720',
      '720:960',
      '1680:720',
    ])
    .describe('图像分辨率比例'),
  seed: z.number().int().min(0).max(4294967295).optional().describe('随机种子'),
  referenceImages: z
    .array(
      z.object({
        uri: z.string().describe('参考图片URL'),
        tag: z.string().min(3).max(16).optional().describe('参考图片标签'),
      }),
    )
    .max(3)
    .optional()
    .describe('最多3张参考图片'),
  contentModeration: z
    .object({
      publicFigureThreshold: z.enum(['auto', 'low']).optional().default('auto'),
    })
    .optional()
    .describe('内容审核设置'),
});

// 视频放大参数
export const VideoUpscaleParamsSchema = z.object({
  videoUri: z
    .string({
      message: '视频URL是必填的，必须是字符串',
    })
    .describe('视频URL，支持HTTPS URL或data URI'),
  model: z.literal('upscale_v1').describe('放大模型，固定为upscale_v1'),
});

// 角色表演控制参数
export const CharacterPerformanceParamsSchema = z.object({
  character: z
    .object({
      type: z.enum(['video', 'image']),
      uri: z.string().describe('角色视频或图片URL'),
    })
    .describe('角色信息'),
  reference: z
    .object({
      type: z.literal('video'),
      uri: z.string().describe('参考表演视频URL'),
    })
    .describe('参考表演视频'),
  model: z.literal('act_two').describe('模型类型，固定为act_two'),
  ratio: z
    .enum([
      '1280:720',
      '720:1280',
      '960:960',
      '1104:832',
      '832:1104',
      '1584:672',
    ])
    .describe('视频分辨率比例'),
  bodyControl: z
    .boolean()
    .optional()
    .default(true)
    .describe('是否启用身体控制'),
  expressionIntensity: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .default(3)
    .describe('表情强度'),
  seed: z.number().int().min(0).max(4294967295).optional().describe('随机种子'),
  contentModeration: z
    .object({
      publicFigureThreshold: z.enum(['auto', 'low']).optional().default('auto'),
    })
    .optional()
    .describe('内容审核设置'),
});

// 请求DTO
export const ImageToVideoRequestSchema = z.object({
  inputs: ImageToVideoParamsSchema,
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

export const VideoToVideoRequestSchema = z.object({
  inputs: VideoToVideoParamsSchema,
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

export const TextToImageRequestSchema = z.object({
  inputs: TextToImageParamsSchema,
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

export const VideoUpscaleRequestSchema = z.object({
  inputs: VideoUpscaleParamsSchema,
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

export const CharacterPerformanceRequestSchema = z.object({
  inputs: CharacterPerformanceParamsSchema,
  credential: z
    .object({
      type: z.string(),
      encryptedData: z.string(),
    })
    .optional()
    .describe('凭证信息'),
});

// DTO类
export class ImageToVideoRequestDto extends createZodDto(
  ImageToVideoRequestSchema,
) {}
export class VideoToVideoRequestDto extends createZodDto(
  VideoToVideoRequestSchema,
) {}
export class TextToImageRequestDto extends createZodDto(
  TextToImageRequestSchema,
) {}
export class VideoUpscaleRequestDto extends createZodDto(
  VideoUpscaleRequestSchema,
) {}
export class CharacterPerformanceRequestDto extends createZodDto(
  CharacterPerformanceRequestSchema,
) {}
