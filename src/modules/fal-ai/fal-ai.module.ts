import { Module } from '@nestjs/common';
import { FalAiController } from './fal-ai.controller';
import { FalAiService } from './fal-ai.service';

@Module({
  controllers: [FalAiController],
  providers: [FalAiService],
})
export class FalAiModule {}
