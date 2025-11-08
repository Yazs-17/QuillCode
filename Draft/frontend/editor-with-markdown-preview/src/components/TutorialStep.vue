<template>
	<div class="tutorial-step">
		<MarkdownNote :content="noteContent" @update="noteContent = $event" />
		<CodeEditor v-model="code" language="javascript" />
		<PreviewPane :code="code" />
	</div>
</template>

<script setup>
import { ref } from 'vue'
import MarkdownNote from './MarkdownNote.vue'
import CodeEditor from './CodeEditor.vue'
import PreviewPane from './PreviewPane.vue'

const noteContent = ref("## 我的笔记\n在这里写下你的理解…")
const code = ref("console.log('Hello, CodeMemo!')")
</script>

<style scoped>
.tutorial-step {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	max-width: 800px;
	margin: 0 auto;
}
</style>
