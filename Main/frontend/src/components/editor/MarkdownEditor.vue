<template>
	<div class="markdown-editor-wrapper">
		<textarea ref="textareaRef" :value="modelValue" class="markdown-textarea" :placeholder="placeholder"
			:readonly="readOnly" @input="handleInput" @focus="$emit('focus')" @blur="$emit('blur')"></textarea>
	</div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
	modelValue: {
		type: String,
		default: ''
	},
	placeholder: {
		type: String,
		default: 'Write your thoughts here...'
	},
	readOnly: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['update:modelValue', 'focus', 'blur'])

const textareaRef = ref(null)

function handleInput (e) {
	emit('update:modelValue', e.target.value)
}

function focus () {
	textareaRef.value?.focus()
}

function getValue () {
	return props.modelValue
}

defineExpose({
	focus,
	getValue
})
</script>

<style scoped>
.markdown-editor-wrapper {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	min-height: 0;
}

.markdown-textarea {
	flex: 1;
	width: 100%;
	height: 100%;
	padding: 16px;
	border: none;
	resize: none;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	font-size: 14px;
	line-height: 1.6;
	background: transparent;
	color: inherit;
	min-height: 0;
}

.markdown-textarea:focus {
	outline: none;
	box-shadow: none;
}

.markdown-textarea::placeholder {
	color: #999;
}
</style>
