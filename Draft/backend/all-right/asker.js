import { Ollama } from "@langchain/ollama";
import { MemoryVectorStore } from "@langchain/community/memory";

const ollama = new Ollama({
	baseUrl: "http://localhost:11434",  // 确保Ollama服务已经启动
	model: "deepseek-r1:8b", // 替换为实际使用的模型
});

const stream = await ollama.stream(
	`你好?`
);

const chunks = [];
for await (const chunk of stream) {
	chunks.push(chunk);
}

console.log(chunks.join(""));