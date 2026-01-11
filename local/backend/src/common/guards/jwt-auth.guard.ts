import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private configService: ConfigService,
    private reflector: Reflector,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if single-user mode is enabled without password protection
    const singleUserMode = this.configService.get<boolean>('app.singleUserMode');
    const localPassword = this.configService.get<string>('app.localPassword');

    // In single-user mode without password, we still require JWT for API calls
    // but the JWT is obtained via the /auth/local-login endpoint
    // This ensures proper user context is maintained
    return super.canActivate(context);
  }
}
