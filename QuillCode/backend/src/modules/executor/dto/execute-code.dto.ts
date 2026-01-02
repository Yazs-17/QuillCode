import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class ExecuteCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsIn(['javascript', 'typescript', 'python', 'java'])
  language: string;

  @IsOptional()
  @IsString()
  input?: string;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string | null;
  executionTime: number;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  type: 'log' | 'info' | 'warn' | 'error' | 'result';
  text: string;
  timestamp: number;
}
