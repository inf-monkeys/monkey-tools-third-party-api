import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RunwayController } from './runway.controller';
import { RunwayService } from './runway.service';

@Module({
  imports: [HttpModule],
  controllers: [RunwayController],
  providers: [RunwayService],
  exports: [RunwayService],
})
export class RunwayModule {}
