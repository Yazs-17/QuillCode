<script setup>
import { ref } from 'vue';
const props = defineProps({

})

const emits = defineEmits([])


const isDisplay = ref(true);

isDisplay.value = false

</script>

<template>
	<div v-if="isDisplay">
		<div id="main" class="container">
			<div class="dialog">
				<p class="title">{{ }}</p>
				<slot></slot>
			</div>

		</div>
	</div>
</template>


<style scoped>
#main {
	position: absolute;
	width: 200px;
	height: 100px;
	bottom: 0;
	top: 0;
	left: 0;
	right: 0;
	margin: auto;
	background-color: red;
}
</style>