import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BflAiController } from './bfl-ai.controller';
import { BflAiService } from './bfl-ai.service';

@Module({
  imports: [HttpModule],
  controllers: [BflAiController],
  providers: [BflAiService],
})
export class BflAiModule {}
