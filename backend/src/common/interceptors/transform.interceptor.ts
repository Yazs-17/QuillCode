import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErrorCode } from '../constants/error-codes';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
  timestamp: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
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
