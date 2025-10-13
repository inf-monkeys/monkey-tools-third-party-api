import { Module } from '@nestjs/common';
import { JimengController } from '@/modules/jimeng/jimeng.controller';
import { JimengV4Service } from '@/modules/jimeng/jimeng.v4.service';
import { JimengArkService } from '@/modules/jimeng/jimeng.ark.service';

@Module({
  controllers: [JimengController],
  providers: [JimengV4Service, JimengArkService],
})
export class JimengModule {}
