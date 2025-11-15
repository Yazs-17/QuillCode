import fs from "fs-extra";
import path from "path";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";

// ---------------------
// 1️⃣ 自定义内存向量库
// ---------------------
class SimpleVectorStore {
	constructor(embeddings) {
		this.embeddings = embeddings;
		this.docs = [];
	}

	async addDocuments (docs) {
		for (const doc of docs) {
			// ⚠ 注意新版 API
			const [vector] = await this.embeddings.embedDocuments([doc.pageContent]);
			this.docs.push({ ...doc, vector });
		}
	}

	async similaritySearch (query, k = 3) {
		const qVec = await this.embeddings.embedQuery(query); // 查询向量
		const scored = this.docs.map(doc => ({
			doc,
			score: cosineSimilarity(doc.vector, qVec)
		}));
		return scored
			.sort((a, b) => b.score - a.score)
			.slice(0, k);
	}
}


// 余弦相似度
function cosineSimilarity (a, b) {
	const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
	const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
	const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
	return dot / (magA * magB);
}

// ---------------------
// 2️⃣ 初始化 Ollama Embeddings + LLM
// ---------------------
const embeddings = new OllamaEmbeddings({
	model: "deepseek-r1:8b" // 替换为你本地 Ollama 模型
});

const llm = new ChatOllama({
	model: "deepseek-r1:8b"
});

const vectorStore = new SimpleVectorStore(embeddings);

// ---------------------
// 3️⃣ 上传文章
// ---------------------
async function uploadArticle (filePath, link) {
	const content = await fs.readFile(filePath, "utf-8");
	await vectorStore.addDocuments([
		{
			pageContent: content,
			metadata: {
				link,
				title: path.basename(filePath)
			}
		}
	]);
	console.log(`✅ 上传成功：${filePath}`);
}

// ---------------------
// 4️⃣ 查询函数
// ---------------------
async function askUser (query) {
	const results = await vectorStore.similaritySearch(query, 5);

	const context = results
		.map(({ doc }) => `【文章：${doc.metadata.title}】\n${doc.pageContent}\n`)
		.join("\n");

	const stream = await llm.stream(`
用户问题：${query}

以下是相关文档，请给出：
1) 最正确的答案
2) 必要的补充说明
3) 按匹配度高到低列出对应链接
4) 对应文章的链接

文档内容：
${context}
`);

	let answer = "";
	for await (const chunk of stream) {
		// ✅ 取文本
		answer += chunk.text ?? chunk.delta ?? "";
	}

	console.log("\n🤖 回答：\n", answer);
}


// ---------------------
// 5️⃣ 示例运行
// ---------------------
async function main () {
	await uploadArticle("./docs/a1.txt", "https://example.com/a1");
	await uploadArticle("./docs/a2.txt", "https://example.com/a2");
	await uploadArticle("./docs/a3.txt", "https://example.com/a3");

	await askUser("你知道传给你的学习文件的链接吗");
}

main();
