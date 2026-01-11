import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';
import { Share, Article } from '../../entities';

@Module({
	imports: [TypeOrmModule.forFeature([Share, Article])],
	controllers: [ShareController],
	providers: [ShareService],
	exports: [ShareService],
})
export class ShareModule { }
