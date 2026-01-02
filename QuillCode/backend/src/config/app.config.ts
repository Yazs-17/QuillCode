import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  mode: process.env.APP_MODE || 'dev',
  port: parseInt(process.env.PORT || '3000', 10),
}));
