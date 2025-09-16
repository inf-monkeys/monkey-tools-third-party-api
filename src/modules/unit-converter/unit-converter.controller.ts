import {
  MonkeyToolCategories,
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
import { UnitConverterService } from './unit-converter.service';
import { UnitConverterRequestDto } from '@/common/schemas/unit-converter';

@Controller('unit-converter')
@UseGuards(new AuthGuard())
@ApiTags('单位转换')
export class UnitConverterController {
  constructor(private readonly unitConverterService: UnitConverterService) {}

  @Post('convert')
  @ApiOperation({
    summary: '单位转换',
    description: '支持长度、重量、温度等单位之间的相互转换',
  })
  @MonkeyToolName('unit_converter')
  @MonkeyToolCategories(['utility'])
  @MonkeyToolIcon('emoji:📐:#4169e1')
  @MonkeyToolDisplayName({
    'zh-CN': '单位转换器',
    'en-US': 'Unit Converter',
  })
  @MonkeyToolExtra({
    isAdvanced: false,
  })
  @MonkeyToolInput([
    {
      name: 'input',
      type: 'json',
      displayName: {
        'zh-CN': '转换参数',
        'en-US': 'Conversion Parameters',
      },
      description: {
        'zh-CN': '请输入要转换的数值和单位信息',
        'en-US': 'Please enter the value and unit information to convert',
      },
      default: {
        value: 100,
        unitType: 'length',
        fromUnit: 'cm',
        toUnit: 'm',
      },
      required: true,
    },
  ])
  @MonkeyToolOutput([
    {
      name: 'data',
      displayName: {
        'zh-CN': '转换结果',
        'en-US': 'Conversion Result',
      },
      type: 'json',
      description: {
        'zh-CN': '单位转换的详细结果，包含原始值、转换值、转换公式等信息',
        'en-US':
          'Detailed result of unit conversion, including original value, converted value, conversion formula, etc.',
      },
    },
  ])
  async convertUnit(@Body() body: UnitConverterRequestDto) {
    return this.unitConverterService.convertUnit(body);
  }
}
