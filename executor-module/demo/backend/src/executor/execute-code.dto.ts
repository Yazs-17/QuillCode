import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class ExecuteCodeDto {
	@IsString()
	@IsNotEmpty()
	code: string;

	@IsString()
	@IsIn(['javascript', 'typescript'])
	language: string;
}
