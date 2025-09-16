import { createZodDto } from '@anatine/zod-nestjs';
import { z } from 'zod';

// 定义支持的单位类型
export const UnitTypeSchema = z
  .enum(['length', 'weight', 'temperature'])
  .describe('单位类型');

// 定义长度单位
export const LengthUnitSchema = z
  .enum(['mm', 'cm', 'm', 'km', 'inch', 'ft', 'yard', 'mile'])
  .describe('长度单位');

// 定义重量单位
export const WeightUnitSchema = z
  .enum(['mg', 'g', 'kg', 'ton', 'oz', 'lb'])
  .describe('重量单位');

// 定义温度单位
export const TemperatureUnitSchema = z
  .enum(['celsius', 'fahrenheit', 'kelvin'])
  .describe('温度单位');

// 定义输入参数的结构
export const UnitConverterParamsSchema = z.object({
  value: z
    .number({
      message: '数值必须是数字',
    })
    .describe('要转换的数值'),

  unitType: UnitTypeSchema.describe('单位类型'),

  fromUnit: z
    .string({
      message: '源单位必须是字符串',
    })
    .describe('源单位'),

  toUnit: z
    .string({
      message: '目标单位必须是字符串',
    })
    .describe('目标单位'),
});

// 定义请求体的结构
export const UnitConverterRequestSchema = z.object({
  inputs: UnitConverterParamsSchema,
});

// 基于 Zod Schema 创建 DTO 类
export class UnitConverterRequestDto extends createZodDto(
  UnitConverterRequestSchema,
) {}
