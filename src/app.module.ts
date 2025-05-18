import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { CommonMiddleware } from './common/middlewares/common.middleware';
import { LogModule } from './modules/log/log.module';
import { FalAiModule } from './modules/fal-ai/fal-ai.module';

@Module({
  imports: [CommonModule, FalAiModule, LogModule],
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
