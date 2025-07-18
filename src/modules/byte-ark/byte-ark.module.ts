import { Module } from '@nestjs/common';
import { ByteArkController } from './byte-ark.controller';
import { ByteArkService } from './byte-ark.service';

@Module({
  controllers: [ByteArkController],
  providers: [ByteArkService],
  exports: [ByteArkService],
})
export class ByteArkModule {}
