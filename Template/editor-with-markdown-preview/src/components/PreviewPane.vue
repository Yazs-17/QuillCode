<template>
	<iframe class="preview-frame" :srcdoc="srcDoc"></iframe>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ code: String })

const srcDoc = computed(() => `
  <html><body>
  <script>${props.code}<\/script>
  </body></html>
`)
</script>

<style scoped>
.preview-frame {
	width: 100%;
	height: 200px;
	border: 1px solid #ccc;
	border-radius: 8px;
}
</style>
