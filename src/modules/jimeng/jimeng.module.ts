import { Module } from '@nestjs/common';
import { JimengController } from '@/modules/jimeng/jimeng.controller';
import { JimengService } from '@/modules/jimeng/jimeng.service';

@Module({
  controllers: [JimengController],
  providers: [JimengService],
})
export class JimengModule { } 