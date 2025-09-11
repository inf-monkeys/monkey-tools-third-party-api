import { Module } from '@nestjs/common';
import { RunwayController } from './runway.controller';
import { RunwayService } from './runway.service';

@Module({
  controllers: [RunwayController],
  providers: [RunwayService],
  exports: [RunwayService],
})
export class RunwayModule {}
