import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ExecutorService } from './executor.service';
import { ExecuteCodeDto, ExecutionResult } from './dto';
import { JwtAuthGuard } from '../../common';

@Controller('executor')
export class ExecutorController {
  constructor(private readonly executorService: ExecutorService) {}

  @Post('run')
  @UseGuards(JwtAuthGuard)
  async execute(
    @Body() executeCodeDto: ExecuteCodeDto,
  ): Promise<ExecutionResult> {
    return this.executorService.execute(executeCodeDto);
  }

  @Get('info')
  getInfo() {
    return {
      mode: this.executorService.getAppMode(),
      supportedLanguages: this.executorService.getSupportedLanguages(),
    };
  }
}
