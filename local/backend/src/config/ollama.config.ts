import { registerAs } from '@nestjs/config';

export default registerAs('ollama', () => ({
	baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
	model: process.env.OLLAMA_MODEL || 'llama3.2',
}));
