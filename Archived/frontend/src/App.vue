<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import FloatingConsole from './components/FloatingConsole.vue';

const languages = [
	{ value: 'javascript', label: 'JavaScript / TypeScript' },
	{ value: 'html', label: 'HTML' },
];

const sampleSnippets = {
	javascript: `// 在此编写 JavaScript / TypeScript 代码\nconst message = 'Hello QuillCode';\nconsole.log('输出:', message);\nmessage.toUpperCase();`,
	html: `<!DOCTYPE html>\n<html lang="zh-CN">\n\t<head>\n\t\t<meta charset="UTF-8" />\n\t\t<title>示例预览</title>\n\t\t<style>body { font-family: 'Segoe UI', sans-serif; padding: 1.5rem; color: #111827; }</style>\n\t</head>\n\t<body>\n\t\t<h1>欢迎来到 QuillCode</h1>\n\t\t<p>这里是实时渲染的 HTML 片段。</p>\n\t\t<button style="padding: 0.4rem 0.8rem; border-radius: 0.5rem; border: none; background: #2563eb; color: white;">互动按钮</button>\n\t</body>\n</html>`,
};

const editorLanguage = ref('javascript');
const editorContent = ref(sampleSnippets.javascript);

const consoleVisible = ref(true);
const consoleLogs = ref([]);
const isRunning = ref(false);

const isHtmlMode = computed(() => editorLanguage.value === 'html');
const hasLogs = computed(() => consoleLogs.value.length > 0);
const isRunDisabled = computed(() => isHtmlMode.value || isRunning.value);
const editorPlaceholder = computed(() =>
	isHtmlMode.value
		? '在此输入 HTML 片段，预览区域会实时渲染内容'
		: '在此输入 JavaScript / TypeScript 代码，使用 Ctrl+Enter 快速运行'
);
const runHint = computed(() =>
	isHtmlMode.value
		? 'HTML 模式实时渲染 · Alt+2 切换 · 键入 ! 自动插入模板'
		: 'Ctrl+Enter 运行 · Alt+1 切换语言 · Ctrl+Shift+C 复制输出'
);
const runButtonLabel = computed(() => (isHtmlMode.value ? 'HTML 实时渲染' : '▶ 运行代码'));

const LOG_ICONS = {
	start: '▶',
	log: '•',
	info: 'ℹ',
	warn: '⚠',
	error: '✖',
	result: '📤',
	success: '✅',
};

const pushLog = (iconKey, message) => {
	const time = new Date().toLocaleTimeString();
	const icon = LOG_ICONS[iconKey] ?? '•';
	consoleLogs.value.push(`[${time}] ${icon} ${message}`);
	if (consoleLogs.value.length > 200) {
		consoleLogs.value.shift();
	}
};

const editorRef = ref(null);
const contextMenuRef = ref(null);
const isContextMenuOpen = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });

const insertCurrentTemplate = (announce = false) => {
	const snippet = sampleSnippets[editorLanguage.value];
	if (!snippet) return;
	editorContent.value = snippet;
	nextTick(() => {
		const textarea = editorRef.value;
		if (textarea) {
			textarea.focus();
			const position = snippet.length;
			textarea.setSelectionRange(position, position);
		}
	});
	if (announce) {
		const label = editorLanguage.value === 'html' ? 'HTML' : 'JavaScript / TypeScript';
		pushLog('info', `${label} 模板已插入到编辑器。`);
	}
};

const handleEditorKeydown = event => {
	if (event.key === '!' && !event.ctrlKey && !event.metaKey && !event.altKey) {
		const textarea = editorRef.value;
		if (!textarea) return;
		const selectionEmpty = textarea.selectionStart === textarea.selectionEnd;
		if (selectionEmpty && !editorContent.value.trim()) {
			event.preventDefault();
			insertCurrentTemplate();
		}
	}
};

const closeContextMenu = () => {
	isContextMenuOpen.value = false;
};

const openContextMenu = event => {
	event.preventDefault();
	closeContextMenu();
	const { clientX, clientY } = event;
	contextMenuPosition.value = { x: clientX, y: clientY };
	isContextMenuOpen.value = true;
	nextTick(() => {
		const menuEl = contextMenuRef.value;
		if (!menuEl) return;
		const { innerWidth, innerHeight } = window;
		const rect = menuEl.getBoundingClientRect();
		const maxX = Math.max(innerWidth - rect.width - 12, 12);
		const maxY = Math.max(innerHeight - rect.height - 12, 72);
		contextMenuPosition.value = {
			x: Math.min(Math.max(12, clientX), maxX),
			y: Math.min(Math.max(72, clientY), maxY),
		};
	});
};

const handleGlobalClick = event => {
	if (!isContextMenuOpen.value) return;
	const menuEl = contextMenuRef.value;
	if (menuEl && menuEl.contains(event.target)) return;
	closeContextMenu();
};

const handleGlobalKeydown = event => {
	if (event.key === 'Escape' && isContextMenuOpen.value) {
		event.preventDefault();
		closeContextMenu();
		return;
	}

	const key = event.key.toLowerCase();
	const targetTag = event.target?.tagName;
	const isEditing = targetTag === 'TEXTAREA' || targetTag === 'INPUT';

	if (event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
		if (event.code === 'Digit1') {
			event.preventDefault();
			editorLanguage.value = 'javascript';
			return;
		}
		if (event.code === 'Digit2') {
			event.preventDefault();
			editorLanguage.value = 'html';
			return;
		}
	}

	if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && key === 'l') {
		event.preventDefault();
		if (hasLogs.value) {
			clearLogs();
			pushLog('info', '控制台输出已清空 (Ctrl+L)。');
		}
		return;
	}

	if (event.ctrlKey && event.shiftKey && !event.metaKey && !event.altKey && key === 'c') {
		event.preventDefault();
		copyLogs();
		return;
	}

	if (event.ctrlKey && event.shiftKey && !event.metaKey && !event.altKey && key === 'x') {
		event.preventDefault();
		consoleVisible.value = !consoleVisible.value;
		pushLog('info', `控制台已${consoleVisible.value ? '展开' : '收起'}。`);
		return;
	}

	if (
		isEditing &&
		event.key === 'ContextMenu'
	) {
		event.preventDefault();
		const rect = editorRef.value?.getBoundingClientRect();
		if (!rect) return;
		openContextMenu({
			preventDefault () { },
			clientX: rect.left + rect.width / 2,
			clientY: rect.top + 24,
		});
	}
};

onMounted(() => {
	if (typeof window !== 'undefined') {
		document.addEventListener('click', handleGlobalClick);
		window.addEventListener('keydown', handleGlobalKeydown);
	}
});

onBeforeUnmount(() => {
	if (typeof window !== 'undefined') {
		document.removeEventListener('click', handleGlobalClick);
		window.removeEventListener('keydown', handleGlobalKeydown);
	}
});

const stringify = value => {
	if (typeof value === 'string') return value;
	if (value instanceof Error) return value.stack || value.message;
	try {
		return JSON.stringify(value, null, 2);
	} catch (error) {
		return String(value);
	}
};

const clearLogs = () => {
	consoleLogs.value = [];
};

const copyLogs = async () => {
	if (!consoleLogs.value.length) {
		pushLog('info', '暂无输出可复制。');
		return;
	}

	const text = consoleLogs.value.join('\n');
	try {
		if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			pushLog('success', '输出内容已复制到剪贴板。');
		} else {
			throw new Error('浏览器不支持剪贴板 API');
		}
	} catch (error) {
		pushLog('error', `复制失败：${error.message || error}`);
	}
};

const sanitizeHtml = raw => {
	if (typeof document === 'undefined' || typeof raw !== 'string') {
		return raw;
	}
	const template = document.createElement('template');
	template.innerHTML = raw;
	template.content
		.querySelectorAll('script, iframe, object, embed, link[rel="import"]')
		.forEach(el => el.remove());
	template.content.querySelectorAll('*').forEach(el => {
		[...el.attributes].forEach(attr => {
			if (/^on/i.test(attr.name)) {
				el.removeAttribute(attr.name);
			}
		});
	});
	return template.innerHTML;
};

const renderedHtml = computed(() => {
	if (!isHtmlMode.value) return '';
	const raw = editorContent.value ?? '';
	if (!raw.trim()) return '';
	return sanitizeHtml(raw);
});

const runCode = async () => {
	closeContextMenu();
	if (isHtmlMode.value) {
		pushLog('info', 'HTML 模式下内容会实时渲染，无需执行。');
		return;
	}

	if (isRunning.value) {
		pushLog('info', '正在执行中，请稍候…');
		return;
	}

	isRunning.value = true;
	pushLog('start', '开始执行编辑器中的代码。');

	const collect = (type, args) => {
		const text = args.map(item => stringify(item)).join(' ');
		pushLog(type, text);
	};

	const consoleProxy = {
		log: (...args) => collect('log', args),
		info: (...args) => collect('info', args),
		warn: (...args) => collect('warn', args),
		error: (...args) => collect('error', args),
	};

	try {
		const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
		const executor = new AsyncFunction('console', 'editor', editorContent.value);
		const result = await executor(consoleProxy, { value: editorContent.value });
		if (result !== undefined) {
			pushLog('result', `返回值：${stringify(result)}`);
		} else {
			pushLog('success', '执行完成（无返回值）。');
		}
	} catch (error) {
		pushLog('error', stringify(error));
	} finally {
		isRunning.value = false;
	}
};

const contextMenuItems = computed(() => [
	{
		label: `${runButtonLabel.value}${isHtmlMode.value ? '' : ' (Ctrl+Enter)'}`,
		action: runCode,
		disabled: isRunDisabled.value,
	},
	{
		label: '清空输出 (Ctrl+L)',
		action: () => {
			if (!hasLogs.value) return;
			clearLogs();
			pushLog('info', '控制台输出已清空 (Ctrl+L)。');
		},
		disabled: !hasLogs.value,
	},
	{
		label: '复制输出 (Ctrl+Shift+C)',
		action: copyLogs,
		disabled: !hasLogs.value,
	},
	{
		label: `插入${isHtmlMode.value ? 'HTML' : 'JS/TS'}模板 (!)`,
		action: () => insertCurrentTemplate(true),
		disabled: false,
	},
	{
		label: `${consoleVisible.value ? '收起' : '展开'}控制台 (Ctrl+Shift+X)`,
		action: () => {
			consoleVisible.value = !consoleVisible.value;
			pushLog('info', `控制台已${consoleVisible.value ? '展开' : '收起'}。`);
		},
		disabled: false,
	},
	{
		label: `切换到${isHtmlMode.value ? 'JavaScript / TypeScript' : 'HTML'}模式 (${isHtmlMode.value ? 'Alt+1' : 'Alt+2'})`,
		action: () => {
			editorLanguage.value = isHtmlMode.value ? 'javascript' : 'html';
		},
		disabled: false,
	},
]);

const runContextAction = action => {
	if (typeof action === 'function') {
		action();
	}
	closeContextMenu();
};

watch(editorLanguage, (next, prev) => {
	const previousSample = sampleSnippets[prev];
	if (previousSample && editorContent.value.trim() === previousSample.trim()) {
		editorContent.value = sampleSnippets[next];
	}
	if (!editorContent.value.trim()) {
		insertCurrentTemplate();
	}
	if (next === 'html') {
		pushLog('info', '切换到 HTML 模式，预览区域实时渲染。');
	} else {
		pushLog('info', '切换到 JavaScript / TypeScript 模式，点击运行执行代码。');
	}
});
</script>

<template>
	<div class="outer">
		<div class="layout">
			<FloatingConsole v-model:modelValue="consoleVisible" :title="'运行控制台'" :logs="consoleLogs" show-label="展开控制台"
				hide-label="收起控制台" @run="runCode" @clear="clearLogs">
				<template #controls>
					<button type="button" :disabled="isRunDisabled" @click="runCode">{{ runButtonLabel }}</button>
					<button type="button" @click="clearLogs">⟲ 清空输出</button>
					<button type="button" :disabled="!hasLogs" @click="copyLogs">⧉ 复制输出</button>
				</template>
			</FloatingConsole>
			<header>
				<span>QuillCode Space</span>
				<span class="header-actions">
					<button>导入文章</button>
					<button>管理员入口</button>
				</span>
			</header>

			<main class="container">
				<aside class="file-manager">
					<h3>📂 文件管理</h3>
					<ul>
						<li>chapter1.md</li>
						<li>chapter2.md</li>
						<li>右键管理.md</li>
					</ul>
				</aside>

				<article class="article">
					<h2>chapter1.md</h2>
					<p>1. 直接渲染后端传过来的markdown</p>
					<p>文件管理栏可以折叠，以便给文章和代码更多空间。</p>
					<p>这个布局结构常用于在线编程学习平台、文档编辑器、AI实验室等。</p>
					<div class="toolbar">
						<button>编辑</button>
						<button>保存</button>
						<!-- <button>保存</button> -->
					</div>
				</article>

				<section class="workspace">
					<div class="editor-pane">
						<div class="editor-toolbar">
							<label class="toolbar-label" for="language-select">模式</label>
							<select id="language-select" v-model="editorLanguage" class="language-select">
								<option v-for="lang in languages" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
							</select>
							<span class="toolbar-hint">{{ runHint }}</span>
						</div>
						<textarea ref="editorRef" v-model="editorContent" class="code-editor" spellcheck="false" autocomplete="off"
							:data-mode="editorLanguage" :placeholder="editorPlaceholder" @keydown="handleEditorKeydown"
							@keydown.ctrl.enter.prevent="!isHtmlMode && runCode()" @contextmenu="openContextMenu"></textarea>
						<ul v-if="isContextMenuOpen" ref="contextMenuRef" class="editor-context-menu"
							:style="{ top: contextMenuPosition.y + 'px', left: contextMenuPosition.x + 'px' }">
							<li v-for="item in contextMenuItems" :key="item.label"
								:class="['context-menu-item', { disabled: item.disabled }]">
								<button type="button" :disabled="item.disabled" @click="runContextAction(item.action)">
									{{ item.label }}
								</button>
							</li>
						</ul>
					</div>
					<div class="preview">
						<div v-if="isHtmlMode" class="preview-html">
							<div v-if="renderedHtml" class="preview-html-content" v-html="renderedHtml"></div>
							<p v-else class="preview-placeholder">输入 HTML 代码将在此实时渲染。</p>
						</div>
						<div v-else class="preview-default">
							<h1>Hello World</h1>
							<p>我是一段实时渲染的内容~</p>
						</div>
					</div>
				</section>
			</main>

			<footer>© 2025 Yazs Lab. All Rights Reserved.</footer>
		</div>
	</div>
</template>

<style scoped>
:global(html),
:global(body),
:global(#app) {
	margin: 0;
	padding: 0;
	height: 100%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--hui);
}

.outer {
	width: 99vw;
	height: 99vh;
	background: var(--bai);
	border-radius: 8px;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	overflow: hidden;
}

* {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
}

button {
	padding: 4px 8px;
	border-radius: 4px;
	background: var(--danhui);
	border: 1px solid var(--hui);
	cursor: pointer;
}


.article .toolbar {
	display: flex;
	gap: 8px;
	margin-top: 0.5rem;
	padding-top: 0.5rem;
	justify-content: flex-end;
	border-top: 1px solid var(--hui);
}

.layout {
	display: grid;
	grid-template-rows: 10vh 1fr 10vh;
	height: 100%;
	width: 100%;
}

.container {
	display: grid;
	grid-template-columns: 200px 1fr 1fr;
	gap: 1rem;
	padding: 1rem;
	overflow: hidden;
}

footer,
header {
	width: 100%;
	border: 1px var(--hui) solid;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
}

header .header-actions {
	display: flex;
	width: 100%;
	padding: 0 1rem;
	justify-content: flex-end;
}

header .header-actions button {
	margin: 0 0.5rem;
}

.file-manager {
	border: 1px solid var(--hui);
	padding: 1rem;
}

li {
	list-style: none;
}

li:first-child {
	background-color: var(--bai);
}

li:hover {
	background-color: var(--bai);
}

textarea {
	border: none;
	outline: none;
	resize: none;
	box-shadow: none;
}

textarea:hover {
	box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
}

.article {
	border: 1px solid var(--hui);
	padding: 1rem;
	overflow-y: auto;
}

.workspace {
	display: grid;
	grid-template-rows: 1fr 1fr;
	gap: 1rem;
	padding: 1rem;
	border: 1px solid var(--hui);
}

.code-editor,
.preview {
	padding: 1rem;
	border-radius: 6px;
	box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

.editor-pane {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	height: 100%;
	position: relative;
}

.editor-context-menu {
	position: fixed;
	z-index: 120;
	min-width: 180px;
	margin: 0;
	padding: 0.35rem 0;
	list-style: none;
	background: rgba(17, 24, 39, 0.96);
	border: 1px solid rgba(148, 163, 184, 0.4);
	border-radius: 10px;
	box-shadow: 0 18px 40px rgba(15, 23, 42, 0.26);
	backdrop-filter: blur(8px);
}

.context-menu-item {
	display: block;
	margin: 0;
}

.context-menu-item button {
	width: 100%;
	padding: 0.45rem 0.85rem;
	text-align: left;
	background: transparent;
	border: none;
	color: rgba(226, 232, 240, 0.92);
	font-size: 0.85rem;
	letter-spacing: 0.01em;
	transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
	cursor: pointer;
}

.context-menu-item button:hover {
	background: rgba(59, 130, 246, 0.2);
	color: #f8fafc;
	transform: translateX(2px);
}

.context-menu-item.disabled button,
.context-menu-item button:disabled {
	opacity: 0.45;
	cursor: not-allowed;
	transform: none;
}

.context-menu-item.disabled button:hover,
.context-menu-item button:disabled:hover {
	background: transparent;
	color: rgba(226, 232, 240, 0.65);
}

.editor-toolbar {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	justify-content: space-between;
	background: rgba(17, 24, 39, 0.85);
	color: #f9fafb;
	padding: 0.55rem 0.85rem;
	border-radius: 8px;
	border: 1px solid rgba(148, 163, 184, 0.25);
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.toolbar-label {
	font-size: 0.85rem;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	opacity: 0.85;
}

.language-select {
	flex: 1;
	max-width: 200px;
	background: rgba(30, 41, 59, 0.8);
	color: #f9fafb;
	border: 1px solid rgba(148, 163, 184, 0.35);
	border-radius: 6px;
	padding: 0.35rem 0.6rem;
	font-size: 0.85rem;
	appearance: none;
	background-image: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(15, 118, 110, 0.3));
	background-position: right 0.6rem center;
	background-size: 1px 1px;
}

.language-select:focus {
	outline: none;
	border-color: rgba(59, 130, 246, 0.6);
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.toolbar-hint {
	font-size: 0.8rem;
	opacity: 0.75;
}

.code-editor {
	width: 100%;
	height: 100%;
	border: 1px solid rgba(148, 163, 184, 0.35);
	border-radius: 8px;
	background: #111827;
	color: #f9fafb;
	font-family: 'Fira Code', 'JetBrains Mono', Consolas, 'Courier New', monospace;
	font-size: 0.92rem;
	line-height: 1.5;
	caret-color: #38bdf8;
	transition: border-color 0.2s ease, box-shadow 0.2s ease;
	box-shadow: none;
}

.code-editor:focus {
	border-color: rgba(59, 130, 246, 0.6);
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35);
}

.code-editor::placeholder {
	color: rgba(148, 163, 184, 0.75);
}

.preview {
	background: linear-gradient(135deg, #f8fafc, #ffffff);
	border: 1px solid rgba(148, 163, 184, 0.3);
}

.preview-html,
.preview-default {
	background: rgba(255, 255, 255, 0.85);
	border-radius: 6px;
	padding: 1rem;
	height: 100%;
	box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.15);
	overflow-y: auto;
}

.preview-html-content {
	min-height: 100%;
}

.preview-placeholder {
	margin: 0;
	color: rgba(71, 85, 105, 0.85);
	font-style: italic;
}

.preview h1 {
	margin-top: 0;
	color: #1f2937;
}

.preview p {
	color: #4b5563;
	line-height: 1.6;
}
</style>
