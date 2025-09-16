import { Module } from '@nestjs/common';
import { UnitConverterController } from './unit-converter.controller';
import { UnitConverterService } from './unit-converter.service';

@Module({
  controllers: [UnitConverterController],
  providers: [UnitConverterService],
  exports: [UnitConverterService],
})
export class UnitConverterModule {}
