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
import { GoogleSearchService } from './google-search.service';
import { GoogleSearchRequestDto } from '@/common/schemas/google-search';

@Controller('google-search')
@UseGuards(new AuthGuard())
@ApiTags('谷歌搜索')
export class GoogleSearchController {
  constructor(private readonly googleSearchService: GoogleSearchService) {}

  @Post('search')
  @ApiOperation({
    summary: '谷歌搜索',
    description:
      '使用 Serper API 进行谷歌搜索，支持网页、购物、图片、新闻等搜索类型',
  })
  @MonkeyToolName('google_search')
  @MonkeyToolCategories(['搜索'])
  @MonkeyToolIcon('emoji:🔍:#4285f4')
  @MonkeyToolDisplayName({
    'zh-CN': '谷歌搜索',
    'en-US': 'Google Search',
  })
  @MonkeyToolExtra({
    isAdvanced: false,
  })
  @MonkeyToolCredentials([
    {
      name: 'google-search',
      required: config.googleSearch?.apiKey ? false : true,
    },
  ])
  @MonkeyToolInput([
    {
      name: 'inputs',
      type: 'json',
      displayName: {
        'zh-CN': '搜索参数',
        'en-US': 'Search Parameters',
      },
      default: {
        q: '',
        gl: 'us',
        hl: 'en',
        type: 'search',
        num: 10,
      },
      description: {
        'zh-CN': '请提供搜索所需的参数',
        'en-US': 'Please provide the required search parameters',
      },
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      type: 'json',
      displayName: {
        'zh-CN': '搜索结果',
        'en-US': 'Search Results',
      },
      description: {
        'zh-CN': '谷歌搜索返回的结果数据',
        'en-US': 'Google search results data',
      },
    },
  ])
  async search(@Body() body: GoogleSearchRequestDto) {
    return this.googleSearchService.search(body);
  }
}
