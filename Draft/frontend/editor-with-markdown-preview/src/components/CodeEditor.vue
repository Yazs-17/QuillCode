<template>
	<div ref="container" class="editor"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps({
	modelValue: String,
	language: { type: String, default: 'javascript' }
})
const emit = defineEmits(['update:modelValue'])
const container = ref()
let editor

onMounted(() => {
	editor = monaco.editor.create(container.value, {
		value: props.modelValue,
		language: props.language,
		theme: 'vs-dark',
		minimap: { enabled: false }
	})
	editor.onDidChangeModelContent(() => {
		emit('update:modelValue', editor.getValue())
	})
})
</script>

<style scoped>
.editor {
	height: 250px;
	border-radius: 8px;
	overflow: hidden;
}
</style>
