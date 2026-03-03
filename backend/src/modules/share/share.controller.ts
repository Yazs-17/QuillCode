import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './dto';
import { JwtAuthGuard } from '../../common';
import { User } from '../../entities';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('shares')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: RequestWithUser,
    @Body() createShareDto: CreateShareDto,
  ) {
    return this.shareService.create(req.user.id, createShareDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Request() req: RequestWithUser) {
    return this.shareService.findAllByUser(req.user.id);
  }

  @Get(':token')
  async findByToken(@Param('token') token: string) {
    return this.shareService.findByToken(token);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.shareService.remove(id, req.user.id);
    return { message: 'Share link deleted successfully' };
  }
}
