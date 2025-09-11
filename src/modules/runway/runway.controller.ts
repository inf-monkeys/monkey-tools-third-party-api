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
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RunwayService } from './runway.service';
import {
  ImageToVideoRequestDto,
  VideoToVideoRequestDto,
  TextToImageRequestDto,
  VideoUpscaleRequestDto,
  CharacterPerformanceRequestDto,
} from '@/common/schemas/runway';

@Controller('runway')
@UseGuards(new AuthGuard())
@ApiTags('Runway ML')
export class RunwayController {
  constructor(private readonly runwayService: RunwayService) {}

  @Post('image-to-video')
  @ApiOperation({
    summary: '图片到视频生成',
    description:
      '使用 Runway ML 将静态图片转换为动态视频，支持 Gen3a Turbo 和 Gen4 Turbo 模型',
  })
  @MonkeyToolName('runway_image_to_video')
  @MonkeyToolCategories(['AI视频生成', '图像处理'])
  @MonkeyToolIcon('emoji:🎬:#6a4cfd')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 图片生成视频',
    'en-US': 'Runway Image to Video',
  })
  @MonkeyToolExtra({
    isAdvanced: false,
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
        'zh-CN': '生成参数',
        'en-US': 'Generation Parameters',
      },
      default: {
        promptImage: '',
        promptText: '',
        model: 'gen4_turbo',
        ratio: '1280:720',
        duration: 10,
      },
      description: {
        'zh-CN':
          '请提供图片到视频生成所需的参数。promptImage: 源图片URL(必填), promptText: 描述视频内容的文本, model: 生成模型(gen4_turbo/gen3a_turbo), ratio: 分辨率比例, duration: 视频时长(5-10秒)',
        'en-US':
          'Please provide image-to-video generation parameters. promptImage: source image URL(required), promptText: text describing video content, model: generation model(gen4_turbo/gen3a_turbo), ratio: resolution ratio, duration: video duration(5-10 seconds)',
      },
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      type: 'json',
      displayName: {
        'zh-CN': '生成结果',
        'en-US': 'Generation Result',
      },
      description: {
        'zh-CN': 'Runway ML 图片到视频生成的结果数据',
        'en-US': 'Runway ML image-to-video generation result data',
      },
    },
  ])
  async imageToVideo(@Body() body: ImageToVideoRequestDto) {
    return this.runwayService.imageToVideo(body);
  }

  @Post('video-to-video')
  @ApiOperation({
    summary: '视频到视频转换',
    description:
      '使用 Runway ML Gen4 Aleph 模型对现有视频进行风格转换或内容修改',
  })
  @MonkeyToolName('runway_video_to_video')
  @MonkeyToolCategories(['AI视频生成', '视频编辑'])
  @MonkeyToolIcon('emoji:🎞️:#6a4cfd')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 视频转视频',
    'en-US': 'Runway Video to Video',
  })
  @MonkeyToolExtra({
    isAdvanced: false,
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
        'zh-CN': '转换参数',
        'en-US': 'Conversion Parameters',
      },
      default: {
        videoUri: '',
        promptText: '',
        model: 'gen4_aleph',
        ratio: '1280:720',
      },
      description: {
        'zh-CN':
          '请提供视频转换所需的参数。videoUri: 源视频URL(必填), promptText: 描述输出视频的文本(必填), model: 固定为gen4_aleph, ratio: 分辨率比例',
        'en-US':
          'Please provide video conversion parameters. videoUri: source video URL(required), promptText: text describing output video(required), model: fixed to gen4_aleph, ratio: resolution ratio',
      },
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      type: 'json',
      displayName: {
        'zh-CN': '转换结果',
        'en-US': 'Conversion Result',
      },
      description: {
        'zh-CN': 'Runway ML 视频到视频转换的结果数据',
        'en-US': 'Runway ML video-to-video conversion result data',
      },
    },
  ])
  async videoToVideo(@Body() body: VideoToVideoRequestDto) {
    return this.runwayService.videoToVideo(body);
  }

  @Post('text-to-image')
  @ApiOperation({
    summary: '文本到图像生成',
    description: '使用 Runway ML Gen4 模型根据文本描述生成高质量图像',
  })
  @MonkeyToolName('runway_text_to_image')
  @MonkeyToolCategories(['AI图像生成'])
  @MonkeyToolIcon('emoji:🖼️:#6a4cfd')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 文本生成图像',
    'en-US': 'Runway Text to Image',
  })
  @MonkeyToolExtra({
    isAdvanced: false,
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
        'zh-CN': '生成参数',
        'en-US': 'Generation Parameters',
      },
      default: {
        promptText: '',
        model: 'gen4_image',
        ratio: '1360:768',
      },
      description: {
        'zh-CN':
          '请提供文本生成图像所需的参数。promptText: 描述图像内容的文本(必填), model: 生成模型(gen4_image/gen4_image_turbo), ratio: 图像分辨率比例',
        'en-US':
          'Please provide text-to-image generation parameters. promptText: text describing image content(required), model: generation model(gen4_image/gen4_image_turbo), ratio: image resolution ratio',
      },
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      type: 'json',
      displayName: {
        'zh-CN': '生成结果',
        'en-US': 'Generation Result',
      },
      description: {
        'zh-CN': 'Runway ML 文本到图像生成的结果数据',
        'en-US': 'Runway ML text-to-image generation result data',
      },
    },
  ])
  async textToImage(@Body() body: TextToImageRequestDto) {
    return this.runwayService.textToImage(body);
  }

  @Post('video-upscale')
  @ApiOperation({
    summary: '视频放大',
    description: '使用 Runway ML 对视频进行4倍放大处理，提升视频分辨率和清晰度',
  })
  @MonkeyToolName('runway_video_upscale')
  @MonkeyToolCategories(['视频处理', '画质增强'])
  @MonkeyToolIcon('emoji:📺:#6a4cfd')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 视频放大',
    'en-US': 'Runway Video Upscale',
  })
  @MonkeyToolExtra({
    isAdvanced: false,
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
        'zh-CN': '放大参数',
        'en-US': 'Upscale Parameters',
      },
      default: {
        videoUri: '',
        model: 'upscale_v1',
      },
      description: {
        'zh-CN':
          '请提供视频放大所需的参数。videoUri: 源视频URL(必填), model: 固定为upscale_v1',
        'en-US':
          'Please provide video upscale parameters. videoUri: source video URL(required), model: fixed to upscale_v1',
      },
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      type: 'json',
      displayName: {
        'zh-CN': '放大结果',
        'en-US': 'Upscale Result',
      },
      description: {
        'zh-CN': 'Runway ML 视频放大的结果数据',
        'en-US': 'Runway ML video upscale result data',
      },
    },
  ])
  async videoUpscale(@Body() body: VideoUpscaleRequestDto) {
    return this.runwayService.videoUpscale(body);
  }

  @Post('character-performance')
  @ApiOperation({
    summary: '角色表演控制',
    description: '使用 Runway ML Act Two 模型控制角色的面部表情和身体动作',
  })
  @MonkeyToolName('runway_character_performance')
  @MonkeyToolCategories(['AI视频生成', '角色动画'])
  @MonkeyToolIcon('emoji:🎭:#6a4cfd')
  @MonkeyToolDisplayName({
    'zh-CN': 'Runway 角色表演',
    'en-US': 'Runway Character Performance',
  })
  @MonkeyToolExtra({
    isAdvanced: true,
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
        'zh-CN': '表演参数',
        'en-US': 'Performance Parameters',
      },
      default: {
        character: {
          type: 'image',
          uri: '',
        },
        reference: {
          type: 'video',
          uri: '',
        },
        model: 'act_two',
        ratio: '1280:720',
        bodyControl: true,
        expressionIntensity: 3,
      },
      description: {
        'zh-CN':
          '请提供角色表演控制所需的参数。character: 角色信息(类型和URI), reference: 参考表演视频, model: 固定为act_two, ratio: 分辨率比例, bodyControl: 是否启用身体控制, expressionIntensity: 表情强度(1-5)',
        'en-US':
          'Please provide character performance parameters. character: character info(type and URI), reference: reference performance video, model: fixed to act_two, ratio: resolution ratio, bodyControl: enable body control, expressionIntensity: expression intensity(1-5)',
      },
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      type: 'json',
      displayName: {
        'zh-CN': '表演结果',
        'en-US': 'Performance Result',
      },
      description: {
        'zh-CN': 'Runway ML 角色表演控制的结果数据',
        'en-US': 'Runway ML character performance result data',
      },
    },
  ])
  async characterPerformance(@Body() body: CharacterPerformanceRequestDto) {
    return this.runwayService.characterPerformance(body);
  }
}
