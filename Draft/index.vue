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
/* 全局布局修正 */
:global(html),
:global(body),
:global(#app) {
	margin: 0;
	padding: 0;
	height: 100%;
	width: 100%;
	box-sizing: border-box;
	background-color: #f8f8f8;
	display: flex;
	justify-content: center;
	align-items: center;
}

/* 外层容器使内容整体居中且 95% 占比 */
.outer {
	width: 95vw;
	height: 95vh;
	display: flex;
	align-items: center;
	justify-content: center;
}

/* 主布局框架 */
.layout {
	display: grid;
	grid-template-rows: 10vh 1fr 10vh;
	width: 100%;
	height: 100%;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	overflow: hidden;
}

/* 顶部与底部 */
header,
footer {
	border: 1px solid var(--hui);
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 1rem;
}

footer {
	justify-content: center;
}

/* 头部按钮区域 */
.header-actions {
	display: flex;
	gap: 0.5rem;
}

/* 主容器三栏布局 */
.container {
	display: grid;
	grid-template-columns: 200px 1fr 1fr;
	gap: 1rem;
	padding: 1rem;
	overflow: hidden;
}

/* 文件管理器 */
.file-manager {
	border: 1px solid var(--hui);
	padding: 1rem;
	border-radius: 6px;
}

li {
	list-style: none;
	cursor: pointer;
	border-radius: 4px;
	padding: 4px;
}

li:first-child {
	background-color: var(--bai);
}

li:hover {
	background-color: var(--bai);
}

/* 文章内容区 */
.article {
	border: 1px solid var(--hui);
	padding: 1rem;
	border-radius: 6px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
}

/* 内部工具栏 */
.toolbar {
	display: flex;
	gap: 8px;
	margin-top: 0.5rem;
	padding-top: 0.5rem;
	justify-content: flex-end;
	border-top: 1px solid var(--hui);
}

/* 编辑器与预览区 */
.workspace {
	display: grid;
	grid-template-rows: 1fr 1fr;
	gap: 1rem;
	padding: 1rem;
	border: 1px solid var(--hui);
	border-radius: 6px;
}

.code-editor,
.preview {
	padding: 1rem;
	border-radius: 6px;
	box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

textarea {
	border: none;
	outline: none;
	resize: none;
	width: 100%;
	height: 100%;
	box-shadow: none;
	font-family: monospace;
}

textarea:hover {
	box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

/* 按钮样式 */
button {
	padding: 4px 8px;
	border-radius: 4px;
	background: var(--danhui);
	border: 1px solid var(--hui);
	cursor: pointer;
}
</style>
