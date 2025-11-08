<template>
	<div class="note">
		<textarea v-model="localContent" @input="emit('update', localContent)" />
		<div class="preview" v-html="compiled"></div>
	</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

const props = defineProps({ content: String })
const emit = defineEmits(['update'])
const localContent = ref(props.content)

watch(() => props.content, val => localContent.value = val)
marked.setOptions({
	highlight (code, lang) {
		return hljs.highlightAuto(code).value
	}
})
const compiled = computed(() => marked(localContent.value))
</script>

<style scoped>
.note {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 1rem;
}

textarea {
	width: 100%;
	height: 200px;
	padding: 0.5rem;
	border-radius: 8px;
	border: 1px solid #ccc;
	font-family: monospace;
}

.preview {
	padding: 1rem;
	background: #1e1e1e;
	color: #fff;
	border-radius: 8px;
	overflow: auto;
}
</style>
