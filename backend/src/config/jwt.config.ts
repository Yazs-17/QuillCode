import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret:
    process.env.JWT_SECRET ||
    '2413bf5f8893d3693bbd6db2bdc5b9f407b571c2fbb7e78b7b25456a0ac6e8c9',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));
