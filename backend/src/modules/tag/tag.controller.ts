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
import { TagService } from './tag.service';
import { CreateTagDto } from './dto';
import { JwtAuthGuard } from '../../common';
import { User } from '../../entities';

interface RequestWithUser extends Request {
	user: User;
}

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
	constructor(private readonly tagService: TagService) { }

	@Post()
	async create(
		@Request() req: RequestWithUser,
		@Body() createTagDto: CreateTagDto,
	) {
		return this.tagService.create(createTagDto, req.user.id);
	}

	@Get()
	async findAll(@Request() req: RequestWithUser) {
		return this.tagService.findAll(req.user.id);
	}

	@Get(':id')
	async findOne(
		@Request() req: RequestWithUser,
		@Param('id') id: string,
	) {
		return this.tagService.findOne(id, req.user.id);
	}

	@Get(':id/articles')
	async getArticlesByTag(
		@Request() req: RequestWithUser,
		@Param('id') id: string,
	) {
		return this.tagService.getArticlesByTag(id, req.user.id);
	}

	@Delete(':id')
	async remove(
		@Request() req: RequestWithUser,
		@Param('id') id: string,
	) {
		await this.tagService.remove(id, req.user.id);
		return { message: 'Tag deleted successfully' };
	}

	@Post(':tagId/articles/:articleId')
	async addTagToArticle(
		@Request() req: RequestWithUser,
		@Param('tagId') tagId: string,
		@Param('articleId') articleId: string,
	) {
		await this.tagService.addTagToArticle(articleId, tagId, req.user.id);
		return { message: 'Tag added to article successfully' };
	}

	@Delete(':tagId/articles/:articleId')
	async removeTagFromArticle(
		@Param('tagId') tagId: string,
		@Param('articleId') articleId: string,
	) {
		await this.tagService.removeTagFromArticle(articleId, tagId);
		return { message: 'Tag removed from article successfully' };
	}
}
