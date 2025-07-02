import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GeminiAiController } from './gemini-ai.controller';
import { GeminiAiService } from './gemini-ai.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 60000, // 增加超时时间到60秒
      maxRedirects: 5, // 设置最大重定向次数
    }),
    ConfigModule,
  ],
  controllers: [GeminiAiController],
  providers: [GeminiAiService],
  exports: [GeminiAiService],
})
export class GeminiAiModule {}
