import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TripoController } from './tripo.controller';
import { TripoService } from './tripo.service';

@Module({
  imports: [HttpModule],
  controllers: [TripoController],
  providers: [TripoService],
})
export class TripoModule {}
