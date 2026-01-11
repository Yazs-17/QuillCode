import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from '../../common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Get authentication mode information
   * Returns whether single-user mode is enabled and if password protection is active
   */
  @Get('mode')
  getAuthMode() {
    return this.authService.getAuthMode();
  }

  /**
   * Single-user mode login (password-free or with local password)
   */
  @Post('local-login')
  async localLogin(@Body() body: { password?: string }) {
    return this.authService.loginSingleUser(body.password);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }
}
