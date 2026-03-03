import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, Article, Tag, Share, Comment } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Article, Tag, Share, Comment])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
