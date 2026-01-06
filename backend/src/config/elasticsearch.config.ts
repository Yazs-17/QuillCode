import { registerAs } from '@nestjs/config';

export default registerAs('elasticsearch', () => ({
	node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
	index: process.env.ELASTICSEARCH_INDEX || 'articles',
}));
