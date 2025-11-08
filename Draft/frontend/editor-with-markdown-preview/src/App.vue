<template>
	<div class="app">
		<h1>🧠 CodeMemo</h1>
		<p class="subtitle">real-active preview code platform</p>
		<TutorialStep />
	</div>
</template>

<script setup>
import TutorialStep from './components/TutorialStep.vue'
</script>

<style scoped>
.app {
	text-align: center;
	padding: 2rem;
	font-family: "JetBrains Mono", monospace;
}

.subtitle {
	color: #777;
	margin-bottom: 2rem;
}
</style>
