/**
 * ============================================
 * 响应转换拦截器 - Transform Interceptor
 * ============================================
 * 
 * 📌 作用：将所有成功响应转换为统一格式
 * 📌 使用：在 main.ts 中全局注册
 * 
 * app.useGlobalInterceptors(new TransformInterceptor());
 * 
 * 转换前：{ id: '123', name: 'test' }
 * 转换后：{
 *   code: 0,
 *   message: 'Success',
 *   data: { id: '123', name: 'test' },
 *   timestamp: 1704067200000
 * }
 */

import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErrorCode } from '../constants/error-codes';

/**
 * 统一响应格式
 */
export interface ApiResponse<T> {
	code: number;
	message: string;
	data: T | null;
	timestamp: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
	intercept(
		context: ExecutionContext,
		next: CallHandler,
	): Observable<ApiResponse<T>> {
		return next.handle().pipe(
			map((data) => ({
				code: ErrorCode.SUCCESS,
				message: 'Success',
				data,
				timestamp: Date.now(),
			})),
		);
	}
}
