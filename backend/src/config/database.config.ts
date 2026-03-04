import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'sqlite',
  database: process.env.DB_DATABASE || 'database.sqlite',
}));
