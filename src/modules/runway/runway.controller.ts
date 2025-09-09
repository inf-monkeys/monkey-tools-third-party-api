import { config } from '@/common/config';
import {
  MonkeyToolCategories,
  MonkeyToolCredentials,
  MonkeyToolDisplayName,
  MonkeyToolExtra,
  MonkeyToolIcon,
  MonkeyToolInput,
  MonkeyToolName,
  MonkeyToolOutput,
} from '@/common/decorators/monkey-block-api-extensions.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  RunwayRequestDto,
  ImageToVideoRequestDto,
  VideoToVideoRequestDto,
  TextToImageRequestDto,
  VideoUpscaleRequestDto,
  CharacterPerformanceRequestDto,
} from '@/common/schemas/runway';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RunwayService } from './runway.service';

@Controller('runway')
@UseGuards(new AuthGuard())
@ApiTags('Runway AI')
export class RunwayController {
  constructor(private readonly runwayService: RunwayService) {}

  @Post('image-to-video')
  @ApiOperation({
    summary: 'Runway 图像转视频',
    description: '使用 Runway Gen3/Gen4 Turbo 模型将图像转换为视频',
  })
  @MonkeyToolName('runway_image_to_video')
  @MonkeyToolCategories(['gen-video'])
  @MonkeyToolIcon('emoji:🎬:#e74c3c')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 图像转视频',
    'en-US': 'Runway Image to Video',
  })
  @MonkeyToolCredentials([
    {
      name: 'runway',
      required: config.runway?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'inputs',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN': '包含图像、模型、分辨率等参数的JSON对象',
        'en-US':
          'JSON object containing image, model, resolution and other parameters',
      },
      default: {
        promptImage: 'https://example.com/image.jpg',
        model: 'gen4_turbo',
        ratio: '1280:720',
        promptText: 'The image comes to life',
        duration: 10,
        seed: null,
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      displayName: {
        'zh-CN': '生成结果',
        'en-US': 'Generated Result',
      },
      type: 'json',
      description: {
        'zh-CN': '生成的视频结果',
        'en-US': 'Generated video result',
      },
    },
    {
      name: 'taskId',
      displayName: {
        'zh-CN': '任务 ID',
        'en-US': 'Task ID',
      },
      type: 'string',
    },
    {
      name: 'requestId',
      displayName: {
        'zh-CN': '请求 ID',
        'en-US': 'Request ID',
      },
      type: 'string',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 300,
    isAdvanced: false,
  })
  async imageToVideo(@Body() body: ImageToVideoRequestDto) {
    return this.runwayService.imageToVideo(body);
  }

  @Post('video-to-video')
  @ApiOperation({
    summary: 'Runway 视频转视频',
    description: '使用 Runway Gen4 Aleph 模型将视频转换为新的视频',
  })
  @MonkeyToolName('runway_video_to_video')
  @MonkeyToolCategories(['gen-video'])
  @MonkeyToolIcon('emoji:🎞️:#9b59b6')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 视频转视频',
    'en-US': 'Runway Video to Video',
  })
  @MonkeyToolCredentials([
    {
      name: 'runway',
      required: config.runway?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'inputs',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN': '包含视频URI、提示文本等参数的JSON对象',
        'en-US':
          'JSON object containing video URI, prompt text and other parameters',
      },
      default: {
        videoUri: 'https://example.com/video.mp4',
        promptText: 'Transform the video style',
        model: 'gen4_aleph',
        ratio: '1280:720',
        seed: null,
        references: [],
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      displayName: {
        'zh-CN': '生成结果',
        'en-US': 'Generated Result',
      },
      type: 'json',
    },
    {
      name: 'taskId',
      displayName: {
        'zh-CN': '任务 ID',
        'en-US': 'Task ID',
      },
      type: 'string',
    },
    {
      name: 'requestId',
      displayName: {
        'zh-CN': '请求 ID',
        'en-US': 'Request ID',
      },
      type: 'string',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 300,
    isAdvanced: false,
  })
  async videoToVideo(@Body() body: VideoToVideoRequestDto) {
    return this.runwayService.videoToVideo(body);
  }

  @Post('text-to-image')
  @ApiOperation({
    summary: 'Runway 文本转图像',
    description: '使用 Runway Gen4 模型从文本生成图像',
  })
  @MonkeyToolName('runway_text_to_image')
  @MonkeyToolCategories(['gen-image'])
  @MonkeyToolIcon('emoji:🖼️:#3498db')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 文本转图像',
    'en-US': 'Runway Text to Image',
  })
  @MonkeyToolCredentials([
    {
      name: 'runway',
      required: config.runway?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'inputs',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN': '包含提示文本、模型、分辨率等参数的JSON对象',
        'en-US':
          'JSON object containing prompt text, model, resolution and other parameters',
      },
      default: {
        promptText: 'A beautiful landscape painting',
        model: 'gen4_image',
        ratio: '1360:768',
        seed: null,
        referenceImages: [],
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      displayName: {
        'zh-CN': '生成结果',
        'en-US': 'Generated Result',
      },
      type: 'json',
    },
    {
      name: 'taskId',
      displayName: {
        'zh-CN': '任务 ID',
        'en-US': 'Task ID',
      },
      type: 'string',
    },
    {
      name: 'requestId',
      displayName: {
        'zh-CN': '请求 ID',
        'en-US': 'Request ID',
      },
      type: 'string',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 60,
    isAdvanced: false,
  })
  async textToImage(@Body() body: TextToImageRequestDto) {
    return this.runwayService.textToImage(body);
  }

  @Post('video-upscale')
  @ApiOperation({
    summary: 'Runway 视频放大',
    description: '使用 Runway 模型将视频放大4倍',
  })
  @MonkeyToolName('runway_video_upscale')
  @MonkeyToolCategories(['enhance-video'])
  @MonkeyToolIcon('emoji:🔍:#f39c12')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 视频放大',
    'en-US': 'Runway Video Upscale',
  })
  @MonkeyToolCredentials([
    {
      name: 'runway',
      required: config.runway?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'inputs',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN': '包含视频URI的JSON对象',
        'en-US': 'JSON object containing video URI',
      },
      default: {
        videoUri: 'https://example.com/video.mp4',
        model: 'upscale_v1',
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      displayName: {
        'zh-CN': '放大结果',
        'en-US': 'Upscaled Result',
      },
      type: 'json',
    },
    {
      name: 'taskId',
      displayName: {
        'zh-CN': '任务 ID',
        'en-US': 'Task ID',
      },
      type: 'string',
    },
    {
      name: 'requestId',
      displayName: {
        'zh-CN': '请求 ID',
        'en-US': 'Request ID',
      },
      type: 'string',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 180,
    isAdvanced: false,
  })
  async videoUpscale(@Body() body: VideoUpscaleRequestDto) {
    return this.runwayService.videoUpscale(body);
  }

  @Post('character-performance')
  @ApiOperation({
    summary: 'Runway 角色表演控制',
    description: '使用 Runway Act Two 模型控制角色的面部表情和身体动作',
  })
  @MonkeyToolName('runway_character_performance')
  @MonkeyToolCategories(['gen-video'])
  @MonkeyToolIcon('emoji:🎭:#e67e22')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 角色表演控制',
    'en-US': 'Runway Character Performance',
  })
  @MonkeyToolCredentials([
    {
      name: 'runway',
      required: config.runway?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'inputs',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN': '包含角色、参考视频、分辨率等参数的JSON对象',
        'en-US':
          'JSON object containing character, reference video, resolution and other parameters',
      },
      default: {
        character: {
          type: 'image',
          uri: 'https://example.com/character.jpg',
        },
        reference: {
          type: 'video',
          uri: 'https://example.com/performance.mp4',
        },
        model: 'act_two',
        ratio: '1280:720',
        bodyControl: true,
        expressionIntensity: 3,
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      displayName: {
        'zh-CN': '表演结果',
        'en-US': 'Performance Result',
      },
      type: 'json',
    },
    {
      name: 'taskId',
      displayName: {
        'zh-CN': '任务 ID',
        'en-US': 'Task ID',
      },
      type: 'string',
    },
    {
      name: 'requestId',
      displayName: {
        'zh-CN': '请求 ID',
        'en-US': 'Request ID',
      },
      type: 'string',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 240,
    isAdvanced: true,
  })
  async characterPerformance(@Body() body: CharacterPerformanceRequestDto) {
    return this.runwayService.characterPerformance(body);
  }

  @Post('general')
  @ApiOperation({
    summary: 'Runway 通用 API 调用',
    description: '通用的 Runway API 调用接口，支持所有功能',
  })
  @MonkeyToolName('runway_general_api')
  @MonkeyToolCategories(['gen-video', 'gen-image', 'enhance-video'])
  @MonkeyToolIcon('emoji:⚡:#1abc9c')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 通用 API',
    'en-US': 'Runway General API',
  })
  @MonkeyToolCredentials([
    {
      name: 'runway',
      required: config.runway?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'inputs',
      type: 'json',
      displayName: {
        'zh-CN': '输入参数',
        'en-US': 'Input Parameters',
      },
      description: {
        'zh-CN':
          '包含所有必要参数的JSON对象，会根据model参数自动选择对应的API端点',
        'en-US':
          'JSON object containing all necessary parameters, will automatically select the corresponding API endpoint based on model parameter',
      },
      default: {
        model: 'gen4_turbo',
        promptImage: 'https://example.com/image.jpg',
        promptText: 'The image comes to life',
        ratio: '1280:720',
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      displayName: {
        'zh-CN': '生成结果',
        'en-US': 'Generated Result',
      },
      type: 'json',
    },
    {
      name: 'taskId',
      displayName: {
        'zh-CN': '任务 ID',
        'en-US': 'Task ID',
      },
      type: 'string',
    },
    {
      name: 'requestId',
      displayName: {
        'zh-CN': '请求 ID',
        'en-US': 'Request ID',
      },
      type: 'string',
    },
  ])
  @MonkeyToolExtra({
    estimateTime: 240,
    isAdvanced: true,
  })
  async callApi(@Body() body: RunwayRequestDto) {
    return this.runwayService.callApi(body);
  }
}
