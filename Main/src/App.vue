<script setup>
import DialogManager from "./common/DialogManager.vue"

import { ref, computed, onMounted, onBeforeMount } from "vue"

import FloatingItem from './components/FloatingConsole.vue'

// import FileController from "./components/FileController.vue"

// const send = (e) => {
// 	console.log(e)
// }
const fmsg = ref("");
// const jsConsole = ref([]);
const clean = (e) => {
	fmsg.value = ""
	// jsConsole.value = []
}




/**
 * Console 增加逻辑
 */

const item = ref(null)
const addConsole = () => {
	let x = +prompt("X: ")
	let y = +prompt("Y: ")
	item.value.addConsole(x, y);
	// console.log(item.value.childFunc)
}

// TODO 代码组织与分块
/**
 * 代码块状态管理
 */
const ENUM = ref({
	JS: 1,
	HTML: 2
})

const mode = ref(ENUM.value.JS)


/**
 * 代码执行逻辑
 */
const editorContent = ref(`
代码加载中...
`)
const outputMsg = ref({ type: 'log', text: '' });


let url = new URL('./utils/executor.js', import.meta.url)
const worker = new Worker(url, { type: "module" })
worker.onmessage = e => {
	let output = e.data;
	// TODO: 解决这里程序阻塞仍然可以添加执行器的bug
	if (output === "isRunning") {
		alert("程序执行中!")
		return
	}
	const formatted = `[${output.type}] ${output.text}`
	item.value?.pushLog(formatted)
	// jsConsole.value.push(formatted)
}
const runCode = async () => {
	if (mode.value !== ENUM.value.JS) {
		alert("当前非JS状态，无需执行")
		return
	}
	worker.postMessage(editorContent.value)
	return;
};

/**
 * 代码渲染逻辑
 */

// TODO 代码危险过滤
const isHtmlMode = computed(() => mode.value === ENUM.value.HTML)
const renderedHtml = computed(() => {
	if (!isHtmlMode.value) return ""
	return editorContent.value.trim()
})
const workspaceRows = computed(() => isHtmlMode.value ? "auto 1fr 1fr" : "auto 1fr")
/**
 * 文件管理逻辑
 */
const fileSysTitle = ref("default files")
const fileManagement = ref([])
const singleFileTitle = ref("")

// const files = ref(null);
const leftPassage = ref("文章加载中	...")
const previewFile = async (e) => {

	const idx = e?.target?.closest('#file')?.dataset?.index ?? 0
	singleFileTitle.value = fileManagement.value[idx];
	const res = await fetch(fileManagement.value[idx])
	const text = await res.text();
	const content = text.split("---")
	leftPassage.value = content[0];
	editorContent.value = content[1]



}

onBeforeMount(
	async () => {
		const modules = import.meta.glob('/public/articles/*.md', { query: 'url' })
		fileManagement.value = Object.keys(modules).map(path => {
			let url = path.substring(7)
			return url
		})
		setTimeout(async () => {
			await previewFile();
		}, 1000)

	}
)

onMounted(
	() => {
		// renderTheFirstFile()
	}
)

</script>

<template>

	<dialog-manager></dialog-manager>
	<div class="outer">
		<div class="layout">
			<header>
				<span>QuillCode Space</span>
				<!-- <span style="floa;"></span> -->
				<span class="header-actions">
					<button @click="test">新建文章</button>
					<button>保存</button>
					<button @click="runCode">Run Code</button>
					<!--temp for  -->
					<button @click="addConsole">新建Console</button>
					<form action.prevent="send">
						<p>给控制台输入信息：</p>
						<input type="text" v-model="fmsg" />
					</form>

				</span>
				<span></span>
			</header>

			<main class="container">

				<FloatingItem ref="item" :fmsg="fmsg" @clean="clean"></FloatingItem>
				<aside class="file-manager">
					<h2>{{ fileSysTitle }}</h2>
					<ul>
						<li v-for="(file, index) in fileManagement" @click="previewFile" :key="index" :data-index="index" id="file"
							class="file-name-li">
							{{ file.substring(10) }}
						</li>
					</ul>
					<!-- <ul>
						<li>chapter1.md</li>
						<li>chapter2.md</li>
						<li>右键管理.md</li>
					</ul> -->
				</aside>

				<article class="article">
					<h2>{{ singleFileTitle }}</h2>
					<div v-html="leftPassage"></div>
					<div class="toolbar">
						<button>编辑</button>
						<button>保存</button>
					</div>
				</article>

				<section class="workspace" :style="{ gridTemplateRows: workspaceRows }">
					<div class="mode-switch">
						<select name="" id="" v-model="mode">
							<option :value="ENUM.JS">JS</option>
							<option :value="ENUM.HTML">HTML</option>
						</select>
					</div>
					<textarea class="code-editor" v-model="editorContent"></textarea>
					<div class="preview" v-if="isHtmlMode">
						<div v-if="renderedHtml" v-html="renderedHtml"></div>
						<p v-else class="preview-placeholder">在这里输入 HTML 预览内容~</p>
					</div>
					<!-- <div class="preview js-console" v-else>
						<h3>JS 控制台输出</h3>
						<ul v-if="jsConsole.length">
							<li v-for="(log, logIndex) in jsConsole" :key="logIndex">{{ log }}</li>
						</ul>
						<p v-else>运行代码后，输出会显示在这里或浮动控制台中。</p>
					</div> -->
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
	background: #f7f7f7;
}

.outer {
	width: 99vw;
	height: 99vh;
	background: #fff;
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

.file-name-li:hover {
	background-color: #888;
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
	gap: 1rem;
	padding: 1rem;
	border: 1px solid var(--hui);
}

.mode-switch {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.mode-switch select {
	padding: 0.25rem 0.75rem;
	border-radius: 4px;
	border: 1px solid var(--hui);
	background-color: var(--bai);
	font-weight: 600;
	cursor: pointer;
}

.mode-switch select:focus {
	outline: none;
	box-shadow: 0 0 0 2px rgba(86, 156, 214, 0.3);
}

.code-editor,
.preview {
	padding: 1rem;
	border-radius: 6px;
	box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}
</style>
