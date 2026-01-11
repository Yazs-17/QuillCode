import { registerAs } from '@nestjs/config';

export type DatabaseType = 'mysql' | 'sqlite';

export interface DatabaseConfig {
	type: DatabaseType;
	// MySQL specific
	host?: string;
	port?: number;
	username?: string;
	password?: string;
	database?: string;
	// SQLite specific
	sqlitePath?: string;
}

export default registerAs('database', (): DatabaseConfig => {
	const dbType = (process.env.DB_TYPE || 'mysql') as DatabaseType;

	if (dbType === 'sqlite') {
		return {
			type: 'sqlite',
			sqlitePath: process.env.SQLITE_PATH || './data/quillcode.db',
		};
	}

	return {
		type: 'mysql',
		host: process.env.DB_HOST || 'localhost',
		port: parseInt(process.env.DB_PORT || '3306', 10),
		username: process.env.DB_USERNAME || 'root',
		password: process.env.DB_PASSWORD || 'sjblp',
		database: process.env.DB_DATABASE || 'code_notebook',
	};
});
