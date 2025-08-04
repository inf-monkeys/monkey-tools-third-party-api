import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OpenAiController } from './openai.controller';
import { OpenAiService } from './openai.service';

@Module({
  imports: [HttpModule],
  controllers: [OpenAiController],
  providers: [OpenAiService],
  exports: [OpenAiService],
})
export class OpenAiModule {}
