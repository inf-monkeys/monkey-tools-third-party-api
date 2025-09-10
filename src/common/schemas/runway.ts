import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';

// Image to Video 参数 Schema
export const ImageToVideoParamsSchema = z.object({
  promptImage: z
    .union([
      z.string().url().describe('图像的 HTTPS URL'),
      z
        .string()
        .regex(/^data:image\/[a-zA-Z]+;base64,/)
        .describe('Base64 编码的图像数据 URI'),
      z
        .array(
          z.object({
            uri: z.string().url().describe('图像的 HTTPS URL'),
            position: z.enum(['first', 'last']).describe('图像在视频中的位置'),
          }),
        )
        .max(2)
        .describe('图像数组（最多2张）'),
    ])
    .describe('输入的提示图像'),
  model: z.enum(['gen4_turbo', 'gen3a_turbo']).describe('使用的模型版本'),
  ratio: z
    .enum([
      '1280:720',
      '720:1280',
      '1104:832',
      '832:1104',
      '960:960',
      '1584:672',
      '1280:768',
      '768:1280',
    ])
    .describe('输出视频的分辨率'),
  seed: z
    .number()
    .int()
    .min(0)
    .max(4294967295)
    .optional()
    .describe('随机种子，用于生成可重复的结果'),
  promptText: z
    .string()
    .max(1000)
    .optional()
    .describe('描述输出内容的文本提示（最多1000字符）'),
  duration: z
    .union([z.literal(5), z.literal(10)])
    .default(10)
    .describe('输出视频的持续时间（秒）'),
  contentModeration: z
    .object({
      publicFigureThreshold: z
        .enum(['auto', 'low'])
        .default('auto')
        .describe('公众人物检测阈值'),
    })
    .optional()
    .describe('内容审核设置'),
});

// Video to Video 参数 Schema
export const VideoToVideoParamsSchema = z.object({
  videoUri: z.string().url().describe('输入视频的 HTTPS URL'),
  promptText: z
    .string()
    .max(1000)
    .describe('描述输出内容的文本提示（最多1000字符）'),
  model: z
    .literal('gen4_aleph')
    .describe('使用的模型版本（固定为 gen4_aleph）'),
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
    .describe('输出视频的分辨率'),
  seed: z
    .number()
    .int()
    .min(0)
    .max(4294967295)
    .optional()
    .describe('随机种子，用于生成可重复的结果'),
  references: z
    .array(
      z.object({
        type: z.literal('image').describe('参考资源类型'),
        uri: z.string().url().describe('参考图像的 HTTPS URL'),
      }),
    )
    .optional()
    .describe('参考图像数组'),
  contentModeration: z
    .object({
      publicFigureThreshold: z
        .enum(['auto', 'low'])
        .default('auto')
        .describe('公众人物检测阈值'),
    })
    .optional()
    .describe('内容审核设置'),
});

// Text to Image 参数 Schema
export const TextToImageParamsSchema = z.object({
  promptText: z
    .string()
    .max(1000)
    .describe('描述输出内容的文本提示（最多1000字符）'),
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
    .describe('输出图像的分辨率'),
  model: z.enum(['gen4_image', 'gen4_image_turbo']).describe('使用的模型版本'),
  seed: z
    .number()
    .int()
    .min(0)
    .max(4294967295)
    .optional()
    .describe('随机种子，用于生成可重复的结果'),
  referenceImages: z
    .array(
      z.object({
        uri: z.string().url().describe('参考图像的 HTTPS URL 或 Data URI'),
        tag: z
          .string()
          .min(3)
          .max(16)
          .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/)
          .optional()
          .describe(
            '参考图像的标签名称（3-16字符，字母数字加下划线，以字母开头）',
          ),
      }),
    )
    .max(3)
    .optional()
    .describe('参考图像数组（最多3张，gen4_image_turbo模型至少需要1张）'),
  contentModeration: z
    .object({
      publicFigureThreshold: z
        .enum(['auto', 'low'])
        .default('auto')
        .describe('公众人物检测阈值'),
    })
    .optional()
    .describe('内容审核设置'),
});

// Video Upscale 参数 Schema
export const VideoUpscaleParamsSchema = z.object({
  videoUri: z.string().url().describe('要放大的视频的 HTTPS URL'),
  model: z
    .literal('upscale_v1')
    .describe('使用的模型版本（固定为 upscale_v1）'),
});

// Character Performance 参数 Schema
export const CharacterPerformanceParamsSchema = z.object({
  character: z
    .union([
      z.object({
        type: z.literal('video').describe('角色类型：视频'),
        uri: z.string().url().describe('角色视频的 HTTPS URL'),
      }),
      z.object({
        type: z.literal('image').describe('角色类型：图像'),
        uri: z.string().url().describe('角色图像的 HTTPS URL'),
      }),
    ])
    .describe('要控制的角色（视频或图像）'),
  reference: z
    .object({
      type: z.literal('video').describe('参考类型：视频'),
      uri: z.string().url().describe('参考表演视频的 HTTPS URL'),
    })
    .describe('参考表演视频'),
  model: z.literal('act_two').describe('使用的模型版本（固定为 act_two）'),
  ratio: z
    .enum([
      '1280:720',
      '720:1280',
      '960:960',
      '1104:832',
      '832:1104',
      '1584:672',
    ])
    .describe('输出视频的分辨率'),
  bodyControl: z
    .boolean()
    .default(true)
    .describe('是否启用身体控制（除面部表情外的动作和手势）'),
  expressionIntensity: z
    .number()
    .int()
    .min(1)
    .max(5)
    .default(3)
    .describe('表情强度（1-5）'),
  seed: z
    .number()
    .int()
    .min(0)
    .max(4294967295)
    .optional()
    .describe('随机种子，用于生成可重复的结果'),
  contentModeration: z
    .object({
      publicFigureThreshold: z
        .enum(['auto', 'low'])
        .default('auto')
        .describe('公众人物检测阈值'),
    })
    .optional()
    .describe('内容审核设置'),
});

// 统一的 Runway 请求 Schema - 进一步简化以避免验证问题
export const RunwayRequestSchema = z
  .object({
    // 完全放宽inputs验证
    inputs: z
      .any() // 允许任意类型
      .optional()
      .describe('输入参数'),

    // 顶层参数也完全放宽
    promptText: z.any().optional(),
    promptImage: z.any().optional(),
    videoUri: z.any().optional(),
    model: z.any().optional(),
    ratio: z.any().optional(),
    seed: z.any().optional(),

    // 凭证信息也放宽
    credential: z.any().optional().describe('凭证信息'),
  })
  .passthrough();

// 创建各个功能的专用 DTO
export class ImageToVideoRequestDto extends createZodDto(
  z.object({
    inputs: ImageToVideoParamsSchema,
    credential: z
      .object({
        id: z.string().optional(),
        type: z.string(),
        encryptedData: z.string().optional(),
        apiKey: z.string().optional(),
        api_key: z.string().optional(),
      })
      .optional(),
  }),
) {}

export class VideoToVideoRequestDto extends createZodDto(
  z.object({
    inputs: VideoToVideoParamsSchema,
    credential: z
      .object({
        id: z.string().optional(),
        type: z.string(),
        encryptedData: z.string().optional(),
        apiKey: z.string().optional(),
        api_key: z.string().optional(),
      })
      .optional(),
  }),
) {}

export class TextToImageRequestDto extends createZodDto(
  z.object({
    inputs: TextToImageParamsSchema,
    credential: z
      .object({
        id: z.string().optional(),
        type: z.string(),
        encryptedData: z.string().optional(),
        apiKey: z.string().optional(),
        api_key: z.string().optional(),
      })
      .optional(),
  }),
) {}

export class VideoUpscaleRequestDto extends createZodDto(
  z.object({
    inputs: VideoUpscaleParamsSchema,
    credential: z
      .object({
        id: z.string().optional(),
        type: z.string(),
        encryptedData: z.string().optional(),
        apiKey: z.string().optional(),
        api_key: z.string().optional(),
      })
      .optional(),
  }),
) {}

export class CharacterPerformanceRequestDto extends createZodDto(
  z.object({
    inputs: CharacterPerformanceParamsSchema,
    credential: z
      .object({
        id: z.string().optional(),
        type: z.string(),
        encryptedData: z.string().optional(),
        apiKey: z.string().optional(),
        api_key: z.string().optional(),
      })
      .optional(),
  }),
) {}

// 通用的 Runway 请求 DTO
export class RunwayRequestDto extends createZodDto(RunwayRequestSchema) {}
