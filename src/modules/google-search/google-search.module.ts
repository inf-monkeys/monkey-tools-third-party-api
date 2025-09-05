import { Module } from '@nestjs/common';
import { GoogleSearchController } from './google-search.controller';
import { GoogleSearchService } from './google-search.service';

@Module({
  controllers: [GoogleSearchController],
  providers: [GoogleSearchService],
  exports: [GoogleSearchService],
})
export class GoogleSearchModule {}
