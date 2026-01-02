import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	@MaxLength(100)
	authorName: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(1)
	@MaxLength(2000)
	content: string;
}
