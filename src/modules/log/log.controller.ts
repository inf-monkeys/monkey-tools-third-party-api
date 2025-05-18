import { Controller, Get, Inject, Param, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('logs')
export class LogController {
  constructor() {}
}
