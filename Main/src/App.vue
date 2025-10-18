<script setup>
</script>

<template>
	<div class="outer">
		<div class="layout">
			<header>
				<span>QuillCode Space</span>
				<span class="header-actions">
					<button>新建文章</button>
					<button>保存</button>
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
					</div>
				</article>

				<section class="workspace">
					<textarea class="code-editor"></textarea>
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
</style>
