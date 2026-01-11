import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  mode: process.env.APP_MODE || 'dev',
  port: parseInt(process.env.PORT || '3000', 10),
  // Single-user mode configuration for local deployment
  // When enabled, allows password-free access with a default local user
  singleUserMode: process.env.SINGLE_USER_MODE === 'true',
  // Optional local password for single-user mode
  localPassword: process.env.LOCAL_PASSWORD || '',
}));
