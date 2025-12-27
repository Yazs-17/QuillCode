import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateShareDto {
	@IsUUID()
	articleId: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(365)
	expiresInDays?: number = 7; // Default 7 days
}
