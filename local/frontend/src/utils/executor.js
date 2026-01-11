let isRunning = false;

function stringify (value) {
	if (value instanceof Error) {
		return value.stack || value.message;
	}
	if (typeof value === 'function') {
		return value.toString();
	}
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

self.onmessage = async (e) => {
	if (isRunning) {
		self.postMessage("isRunning")
	};
	isRunning = true;

	const code = e.data;

	const collect = (type, args) => {
		const text = args.map(item => stringify(item)).join(' ');
		self.postMessage({ type, text }); // ✅ 回传日志
	};

	const consoleProxy = {
		log: (...args) => collect('log', args),
		info: (...args) => collect('info', args),
		warn: (...args) => collect('warn', args),
		error: (...args) => collect('error', args),
	};

	try {
		const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
		const executor = new AsyncFunction('console', 'editor', code);
		const result = await executor(consoleProxy, { value: code });
		if (result !== undefined) {
			self.postMessage({ type: 'result', text: `返回值：${stringify(result)}` });
		} else {
			self.postMessage({ type: 'success', text: '执行完成（无返回值）。' });
		}
	} catch (error) {
		self.postMessage({ type: 'error', text: stringify(error) });
	} finally {
		isRunning = false;
	}
};
