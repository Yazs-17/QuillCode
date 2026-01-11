import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities';
import { UserRole } from '../../entities/user.entity';
import { RegisterDto, LoginDto } from './dto';
import { ErrorCode, ErrorMessages } from '../../common';

// Default local user constants
const LOCAL_USER_ID = 'local-user-00000000-0000-0000-0000-000000000001';
const LOCAL_USER_USERNAME = 'local';
const LOCAL_USER_EMAIL = 'local@localhost';

@Injectable()
export class AuthService {
  private readonly singleUserMode: boolean;
  private readonly localPassword: string;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.singleUserMode =
      this.configService.get<boolean>('app.singleUserMode') || false;
    this.localPassword =
      this.configService.get<string>('app.localPassword') || '';
  }

  /**
   * Check if single-user mode is enabled
   */
  isSingleUserMode(): boolean {
    return this.singleUserMode;
  }

  /**
   * Check if local password protection is enabled
   */
  isPasswordProtected(): boolean {
    return this.singleUserMode && this.localPassword.length > 0;
  }

  /**
   * Get or create the local user for single-user mode
   */
  private async getOrCreateLocalUser(): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { id: LOCAL_USER_ID },
    });

    if (!user) {
      // Create the local user
      user = this.userRepository.create({
        id: LOCAL_USER_ID,
        username: LOCAL_USER_USERNAME,
        email: LOCAL_USER_EMAIL,
        passwordHash: undefined, // No password hash for local user
        role: UserRole.ADMIN, // Local user has admin privileges
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  /**
   * Login for single-user mode (password-free or with local password)
   */
  async loginSingleUser(
    password?: string,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    if (!this.singleUserMode) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_FAILED,
        message: 'Single-user mode is not enabled',
      });
    }

    // Check local password if configured
    if (this.isPasswordProtected()) {
      if (!password || password !== this.localPassword) {
        throw new UnauthorizedException({
          code: ErrorCode.INVALID_CREDENTIALS,
          message: ErrorMessages[ErrorCode.INVALID_CREDENTIALS],
        });
      }
    }

    const user = await this.getOrCreateLocalUser();

    // Generate JWT token
    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Get auth mode information for the client
   */
  getAuthMode(): { singleUserMode: boolean; passwordProtected: boolean } {
    return {
      singleUserMode: this.singleUserMode,
      passwordProtected: this.isPasswordProtected(),
    };
  }

  async register(registerDto: RegisterDto): Promise<{ user: Partial<User> }> {
    // In single-user mode, registration is disabled
    if (this.singleUserMode) {
      throw new ConflictException({
        code: ErrorCode.USER_EXISTS,
        message: 'Registration is disabled in single-user mode',
      });
    }

    const { username, email, password } = registerDto;

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException({
        code: ErrorCode.USER_EXISTS,
        message: ErrorMessages[ErrorCode.USER_EXISTS],
      });
    }

    // Hash password with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      username,
      email,
      passwordHash,
    });

    await this.userRepository.save(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const { username, password } = loginDto;

    // In single-user mode, redirect to single-user login
    if (this.singleUserMode) {
      return this.loginSingleUser(password);
    }

    // Find user by username
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: ErrorMessages[ErrorCode.INVALID_CREDENTIALS],
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: ErrorMessages[ErrorCode.INVALID_CREDENTIALS],
      });
    }

    // Generate JWT token
    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.AUTH_FAILED,
        message: ErrorMessages[ErrorCode.AUTH_FAILED],
      });
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
