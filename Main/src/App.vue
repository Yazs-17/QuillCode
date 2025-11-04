<script setup>
import DialogManager from "./common/DialogManager.vue"

import { ref } from "vue"

import FloatingItem from './components/FloatingConsole.vue'

// const send = (e) => {
// 	console.log(e)
// }
const fmsg = ref("");
const clean = (e) => {
	fmsg.value = ""
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



/**
 * 代码执行逻辑
 */
const editorContent = ref(`
let a = 0;
let b = 1;
console.log(a+b)
`)
const outputMsg = ref({ type: 'log', text: '' });


let code = editorContent.value;
let url = new URL('./utils/executor.js', import.meta.url)
const worker = new Worker(url, { type: "module" })
worker.onmessage = e => {
	let output = e.data;
	// TODO: 解决这里程序阻塞仍然可以添加执行器的bug
	if (output === "isRunning") {
		alert("程序执行中!")
	}
	item.value.pushLog(`[${e.data.type}] ${e.data.text}`)
}
const runCode = async () => {
	worker.postMessage(code)
	return;
};

/**
 * 代码渲染逻辑
 */




</script>

<template>

	<dialog-manager></dialog-manager>
	<div class="outer">
		<div class="layout">
			<header>
				<span>QuillCode Space</span>
				<span class="header-actions">
					<button>新建文章</button>
					<button>保存</button>
					<button @click="runCode">Run Code</button>
					<!--temp for  -->
					<button @click="addConsole">新建Console</button>
					<form action.prevent="send">
						<p>给控制台输入信息：</p>
						<input type="text" v-model="fmsg" />
					</form>

				</span>
			</header>

			<main class="container">

				<FloatingItem ref="item" :fmsg="fmsg" @clean="clean"></FloatingItem>
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
					</div>
				</article>

				<section class="workspace">
					<div class="">
						<select name="" id="">
							<option value="0">JS</option>
							<option value="1">HTML</option>
						</select>
					</div>
					<textarea class="code-editor" v-model="editorContent">
					</textarea>
					<div class="preview">
						<div>
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
	grid-template-rows: 10px 1fr 1fr;
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
</style>
