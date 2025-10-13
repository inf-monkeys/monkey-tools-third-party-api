import { Module } from '@nestjs/common';
import { JimengController } from '@/modules/jimeng/jimeng.controller';
import { JimengArkService } from '@/modules/jimeng/jimeng.ark.service';

@Module({
  controllers: [JimengController],
  providers: [JimengArkService],
})
export class JimengModule {}
