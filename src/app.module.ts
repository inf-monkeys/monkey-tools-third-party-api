import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { CommonMiddleware } from './common/middlewares/common.middleware';
import { LogModule } from './modules/log/log.module';
import { FalAiModule } from './modules/fal-ai/fal-ai.module';
import { JimengModule } from './modules/jimeng/jimeng.module';
import { TripoModule } from './modules/tripo/tripo.module';
import { BflAiModule } from './modules/bfl-ai/bfl-ai.module';
import { GeminiAiModule } from './modules/gemini-ai/gemini-ai.module';
import { ByteArkModule } from './modules/byte-ark/byte-ark.module';
import { OpenAiModule } from './modules/openai/openai.module';
import { GoogleSearchModule } from './modules/google-search/google-search.module';
import { RunwayModule } from './modules/runway/runway.module';

@Module({
  imports: [
    CommonModule,
    FalAiModule,
    LogModule,
    JimengModule,
    TripoModule,
    BflAiModule,
    GeminiAiModule,
    ByteArkModule,
    OpenAiModule,
    GoogleSearchModule,
    RunwayModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CommonMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
