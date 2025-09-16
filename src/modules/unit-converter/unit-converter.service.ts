import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { UnitConverterRequestDto } from '@/common/schemas/unit-converter';

@Injectable()
export class UnitConverterService {
  private readonly logger = new Logger(UnitConverterService.name);

  // 长度单位转换到米的比率
  private readonly lengthUnits: Record<string, number> = {
    mm: 0.001,
    cm: 0.01,
    m: 1,
    km: 1000,
    inch: 0.0254,
    ft: 0.3048,
    yard: 0.9144,
    mile: 1609.344,
  };

  // 重量单位转换到克的比率
  private readonly weightUnits: Record<string, number> = {
    mg: 0.001,
    g: 1,
    kg: 1000,
    ton: 1000000,
    oz: 28.3495,
    lb: 453.592,
  };

  /**
   * 执行单位转换
   * @param inputData 请求参数
   * @returns 转换结果
   */
  async convertUnit(inputData: UnitConverterRequestDto) {
    try {
      const { value, unitType, fromUnit, toUnit } = inputData.inputs;

      this.logger.log(
        `Converting ${value} from ${fromUnit} to ${toUnit} (type: ${unitType})`,
      );

      let result: number;
      let formula: string;

      switch (unitType) {
        case 'length':
          result = this.convertLength(value, fromUnit, toUnit);
          formula = this.getLengthFormula(fromUnit, toUnit);
          break;
        case 'weight':
          result = this.convertWeight(value, fromUnit, toUnit);
          formula = this.getWeightFormula(fromUnit, toUnit);
          break;
        case 'temperature':
          result = this.convertTemperature(value, fromUnit, toUnit);
          formula = this.getTemperatureFormula(fromUnit, toUnit);
          break;
        default:
          throw new BadRequestException(`不支持的单位类型: ${unitType}`);
      }

      return {
        data: {
          originalValue: value,
          originalUnit: fromUnit,
          convertedValue: result,
          convertedUnit: toUnit,
          unitType: unitType,
          formula: formula,
          precision: this.getPrecision(result),
        },
        success: true,
        message: `成功将 ${value} ${fromUnit} 转换为 ${result} ${toUnit}`,
      };
    } catch (error) {
      this.logger.error(`单位转换失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 转换长度单位
   */
  private convertLength(
    value: number,
    fromUnit: string,
    toUnit: string,
  ): number {
    if (!this.lengthUnits[fromUnit]) {
      throw new BadRequestException(`不支持的长度单位: ${fromUnit}`);
    }
    if (!this.lengthUnits[toUnit]) {
      throw new BadRequestException(`不支持的长度单位: ${toUnit}`);
    }

    // 先转换为米，再转换为目标单位
    const valueInMeters = value * this.lengthUnits[fromUnit];
    return valueInMeters / this.lengthUnits[toUnit];
  }

  /**
   * 转换重量单位
   */
  private convertWeight(
    value: number,
    fromUnit: string,
    toUnit: string,
  ): number {
    if (!this.weightUnits[fromUnit]) {
      throw new BadRequestException(`不支持的重量单位: ${fromUnit}`);
    }
    if (!this.weightUnits[toUnit]) {
      throw new BadRequestException(`不支持的重量单位: ${toUnit}`);
    }

    // 先转换为克，再转换为目标单位
    const valueInGrams = value * this.weightUnits[fromUnit];
    return valueInGrams / this.weightUnits[toUnit];
  }

  /**
   * 转换温度单位
   */
  private convertTemperature(
    value: number,
    fromUnit: string,
    toUnit: string,
  ): number {
    // 先转换为摄氏度
    let celsius: number;
    switch (fromUnit) {
      case 'celsius':
        celsius = value;
        break;
      case 'fahrenheit':
        celsius = ((value - 32) * 5) / 9;
        break;
      case 'kelvin':
        celsius = value - 273.15;
        break;
      default:
        throw new BadRequestException(`不支持的温度单位: ${fromUnit}`);
    }

    // 从摄氏度转换为目标单位
    switch (toUnit) {
      case 'celsius':
        return celsius;
      case 'fahrenheit':
        return (celsius * 9) / 5 + 32;
      case 'kelvin':
        return celsius + 273.15;
      default:
        throw new BadRequestException(`不支持的温度单位: ${toUnit}`);
    }
  }

  /**
   * 获取长度转换公式说明
   */
  private getLengthFormula(fromUnit: string, toUnit: string): string {
    const fromRatio = this.lengthUnits[fromUnit];
    const toRatio = this.lengthUnits[toUnit];
    const factor = fromRatio / toRatio;
    return `1 ${fromUnit} = ${factor} ${toUnit}`;
  }

  /**
   * 获取重量转换公式说明
   */
  private getWeightFormula(fromUnit: string, toUnit: string): string {
    const fromRatio = this.weightUnits[fromUnit];
    const toRatio = this.weightUnits[toUnit];
    const factor = fromRatio / toRatio;
    return `1 ${fromUnit} = ${factor} ${toUnit}`;
  }

  /**
   * 获取温度转换公式说明
   */
  private getTemperatureFormula(fromUnit: string, toUnit: string): string {
    if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
      return '°F = °C × 9/5 + 32';
    } else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
      return '°C = (°F - 32) × 5/9';
    } else if (fromUnit === 'celsius' && toUnit === 'kelvin') {
      return 'K = °C + 273.15';
    } else if (fromUnit === 'kelvin' && toUnit === 'celsius') {
      return '°C = K - 273.15';
    } else if (fromUnit === 'fahrenheit' && toUnit === 'kelvin') {
      return 'K = (°F - 32) × 5/9 + 273.15';
    } else if (fromUnit === 'kelvin' && toUnit === 'fahrenheit') {
      return '°F = (K - 273.15) × 9/5 + 32';
    } else {
      return `${fromUnit} to ${toUnit}`;
    }
  }

  /**
   * 获取合适的精度
   */
  private getPrecision(value: number): number {
    const rounded = Math.round(value * 10000) / 10000;
    return rounded;
  }
}
