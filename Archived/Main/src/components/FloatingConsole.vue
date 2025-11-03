<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
	title: {
		type: String,
		default: '运行控制台',
	},
	modelValue: {
		type: Boolean,
		default: true,
	},
	showLabel: {
		type: String,
		default: '展开控制台',
	},
	hideLabel: {
		type: String,
		default: '收起控制台',
	},
	initialPosition: {
		type: Object,
		default: () => ({ x: 48, y: 120 }),
	},
	logs: {
		type: Array,
		default: () => [],
	},
});

const emit = defineEmits(['update:modelValue', 'toggle', 'run', 'clear']);


const isVisible = ref(props.modelValue);
const position = ref({
	x: props.initialPosition?.x ?? 48,
	y: props.initialPosition?.y ?? 120,
});

const wrapperRef = ref(null);
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

watch(
	() => props.modelValue,
	value => {
		isVisible.value = value;
	}
);

watch(isVisible, value => {
	console.log(value)
	emit('update:modelValue', value);
	emit('toggle', value);
});

const rootStyle = computed(() => ({
	top: `${position.value.y}px`,
	left: `${position.value.x}px`,
}));

const logEntries = computed(() => props.logs ?? []);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const updatePosition = (clientX, clientY) => {
	const element = wrapperRef.value;
	if (!element) return;

	const { width, height } = element.getBoundingClientRect();
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;
	const maxX = Math.max(viewportWidth - width - 16, 16);
	const maxY = Math.max(viewportHeight - height - 16, 72);

	position.value = {
		x: clamp(clientX - dragOffset.value.x, 16, maxX),
		y: clamp(clientY - dragOffset.value.y, 72, maxY),
	};
};

const onPointerMove = event => {
	if (!isDragging.value) return;
	updatePosition(event.clientX, event.clientY);
};

const stopDragging = () => {
	isDragging.value = false;
	window.removeEventListener('pointermove', onPointerMove);
	window.removeEventListener('pointerup', stopDragging);
};

const startDrag = event => {
	if (!isVisible.value) return;
	const element = wrapperRef.value;
	if (!element) return;

	isDragging.value = true;
	const rect = element.getBoundingClientRect();
	dragOffset.value = {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};

	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('pointerup', stopDragging);
	event.preventDefault();
};

const toggleVisibility = () => {
	isVisible.value = !isVisible.value;
};

onMounted(() => {
	const element = wrapperRef.value;
	if (!element) return;
	const { innerWidth, innerHeight } = window;
	const { width, height } = element.getBoundingClientRect();
	position.value = {
		x: clamp(position.value.x, 16, innerWidth - width - 16),
		y: clamp(position.value.y, 72, innerHeight - height - 16),
	};
});

onBeforeUnmount(() => {
	window.removeEventListener('pointermove', onPointerMove);
	window.removeEventListener('pointerup', stopDragging);
});

</script>

<template>
	<div class="console-root" :class="{ hidden: !isVisible }" :style="rootStyle">
		<transition name="console">
			<section v-if="isVisible" ref="wrapperRef" class="console-panel">
				<header class="console-header" @pointerdown="startDrag">
					<span class="console-title">{{ title }}</span>
					<button type="button" class="toggle-button" @click.stop="toggleVisibility">
						{{ hideLabel }}
					</button>
				</header>

				<div class="console-body">
					<aside class="control-column">
						<slot name="controls">
							<button type="button" class="control-button" @click="$emit('run')">▶ 运行</button>
							<button type="button" class="control-button" @click="$emit('clear')">⟲ 清空</button>
						</slot>
					</aside>
					<section class="output-column">
						<slot name="output">
							<div class="log-stream" aria-live="polite">
								<p v-if="!logEntries.length" class="log-placeholder">暂无输出，点击运行执行代码。</p>
								<p v-for="(entry, index) in logEntries" :key="index" class="log-line">{{ entry }}</p>
							</div>
						</slot>
					</section>
				</div>
			</section>
		</transition>

		<button v-if="!isVisible" type="button" class="floating-toggle" @click="toggleVisibility">
			{{ showLabel }}
		</button>
	</div>
</template>

<style scoped>
.console-root {
	position: fixed;
	z-index: 80;
}

.console-root.hidden .floating-toggle {
	pointer-events: auto;
}

.console-panel {
	min-width: 320px;
	max-width: 420px;
	background: rgba(255, 255, 255, 0.95);
	border: 1px solid rgba(40, 40, 40, 0.1);
	border-radius: 12px;
	box-shadow: 0 10px 30px rgba(15, 23, 42, 0.18);
	backdrop-filter: blur(6px);
	overflow: hidden;
	pointer-events: auto;
}

.console-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem 1rem;
	border-bottom: 1px solid rgba(40, 40, 40, 0.08);
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(243, 244, 246, 0.95));
	cursor: grab;
	user-select: none;
}

.console-header:active {
	cursor: grabbing;
}

.console-title {
	font-size: 0.95rem;
	font-weight: 600;
	color: #1f2937;
}

.toggle-button,
.floating-toggle,
.control-button,
.control-column :deep(button) {
	border: 1px solid rgba(40, 40, 40, 0.12);
	background: linear-gradient(135deg, #ffffff, #f3f4f6);
	color: #1f2937;
	border-radius: 999px;
	padding: 0.35rem 0.85rem;
	font-size: 0.82rem;
	transition: all 0.18s ease;
	cursor: pointer;
}

.toggle-button:hover,
.floating-toggle:hover,
.control-button:hover,
.control-column :deep(button:hover) {
	box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
	transform: translateY(-1px);
}

.console-body {
	display: grid;
	grid-template-columns: 120px minmax(240px, 1fr);
	gap: 0;
}

.control-column {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0.9rem;
	border-right: 1px solid rgba(40, 40, 40, 0.08);
	background: rgba(248, 250, 252, 0.85);
}

.control-column :deep(button) {
	width: 100%;
	text-align: left;
	display: flex;
	align-items: center;
	gap: 0.4rem;
}

.control-column :deep(button:disabled) {
	opacity: 0.65;
	cursor: not-allowed;
	box-shadow: none;
	transform: none;
}

.output-column {
	padding: 0.9rem;
	background: rgba(255, 255, 255, 0.96);
}

.log-stream {
	max-height: 240px;
	overflow-y: auto;
	font-family: 'Fira Code', 'JetBrains Mono', Consolas, 'Courier New', monospace;
	font-size: 0.85rem;
	color: #1f2937;
	line-height: 1.5;
	padding-right: 0.25rem;
}

.log-line {
	margin: 0;
	padding: 0.15rem 0;
	border-bottom: 1px dashed rgba(40, 40, 40, 0.06);
}

.log-line:last-of-type {
	border-bottom: none;
}

.log-placeholder {
	margin: 0;
	color: rgba(107, 114, 128, 0.9);
	font-style: italic;
}

.floating-toggle {
	pointer-events: auto;
	position: absolute;
	top: 0;
	left: 0;
}

.console-enter-active,
.console-leave-active {
	transition: all 0.2s ease;
	transform-origin: top center;
}

.console-enter-from,
.console-leave-to {
	opacity: 0;
	transform: translateY(-10px) scale(0.96);
}
</style>
