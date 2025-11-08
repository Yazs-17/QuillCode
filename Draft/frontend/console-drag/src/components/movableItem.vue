<style scoped>
.movable {
	position: absolute;
	min-width: 220px;
	max-width: clamp(240px, 22vw, 320px);
	min-height: 120px;
	padding: 1.5rem 1.75rem;
	border-radius: 16px;
	background: var(--movable-bg, linear-gradient(135deg, #7f7fd5, #86a8e7, #91eae4));
	color: var(--movable-text, #ffffff);
	box-shadow: 0 18px 30px rgba(15, 23, 42, 0.28);
	cursor: grab;
	user-select: none;
	will-change: transform;
	transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.movable:active {
	cursor: grabbing;
	box-shadow: 0 24px 48px rgba(15, 23, 42, 0.35);
}

.title {
	font-size: 1.15rem;
	font-weight: 700;
	letter-spacing: 0.03em;
}

.content {
	margin-top: 0.85rem;
	font-size: 0.92rem;
	line-height: 1.5;
	opacity: 0.92;
}

.message {
	margin-top: 0.85rem;
	padding: 0.65rem 0.75rem;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.16);
	font-size: 0.82rem;
	backdrop-filter: blur(6px);
}

.incoming {
	border: 1px solid rgba(255, 255, 255, 0.35);
}

.actions {
	margin-top: 1.1rem;
	display: flex;
	gap: 0.75rem;
	align-items: center;
}

.reply-btn {
	padding: 0.4rem 0.85rem;
	border-radius: 999px;
	border: none;
	font-size: 0.82rem;
	font-weight: 600;
	color: #0f172a;
	background: rgba(255, 255, 255, 0.85);
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.reply-btn:hover {
	transform: translateY(-1px);
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.16);
}

.reply-btn:active {
	transform: translateY(0);
}

.coordinates {
	font-size: 0.75rem;
	opacity: 0.7;
}
</style>

<template>
	<div ref="node" class="movable"
		:style="[{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }, styleVars]" role="button" :title="title"
		@pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp">
		<div class="title">{{ title }}</div>
		<div class="content">
			<slot>
				<div class="hint">按住并拖拽，一切尽在指尖。</div>
			</slot>
		</div>
		<div v-if="appMessage" class="message incoming">来自 App：{{ appMessage }}</div>
		<div class="actions">
			<button v-if="enableReply" class="reply-btn" type="button" @click="notifyApp">
				{{ replyLabel }}
			</button>
			<div class="coordinates">x: {{ Math.round(position.x) }}, y: {{ Math.round(position.y) }}</div>
		</div>
		<slot name="footer" :position="position" :notify-app="notifyApp"></slot>
	</div>
</template>


<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
	initialPosition: {
		type: Object,
		default: () => ({ x: 0, y: 0 })
	},
	title: {
		type: String,
		default: '拖动我到任意位置'
	},
	appMessage: {
		type: String,
		default: ''
	},
	enableReply: {
		type: Boolean,
		default: true
	},
	replyLabel: {
		type: String,
		default: '告诉 App：已收到'
	},
	replyPayload: {
		type: [String, Object, Function],
		default: () => 'Movable item 收到了一条消息'
	},
	theme: {
		type: Object,
		default: () => ({
			background: 'linear-gradient(135deg, #7f7fd5, #86a8e7, #91eae4)',
			text: '#ffffff'
		})
	}
})

const emits = defineEmits(['drag-start', 'dragging', 'drag-end', 'reply'])

const node = ref(null)
const position = reactive({ x: 0, y: 0 })
const styleVars = computed(() => ({
	'--movable-bg': props.theme?.background ?? 'linear-gradient(135deg, #7f7fd5, #86a8e7, #91eae4)',
	'--movable-text': props.theme?.text ?? '#ffffff'
}))

let dragStart = { x: 0, y: 0 }
let origin = { x: 0, y: 0 }
let pointerId = null
let dragging = false

watch(
	() => props.initialPosition,
	(value) => {
		if (!value || dragging) return
		position.x = Number.isFinite(value.x) ? value.x : 0
		position.y = Number.isFinite(value.y) ? value.y : 0
		origin = { ...position }
	},
	{ immediate: true, deep: true }
)

const onPointerDown = (event) => {
	if (!node.value) return
	pointerId = event.pointerId
	dragging = true
	dragStart = { x: event.clientX, y: event.clientY }
	origin = { ...position }
	node.value.setPointerCapture(pointerId)
	emits('drag-start', { position: { ...position }, originalEvent: event })
}

const onPointerMove = (event) => {
	if (pointerId === null || event.pointerId !== pointerId) return
	const dx = event.clientX - dragStart.x
	const dy = event.clientY - dragStart.y
	position.x = origin.x + dx
	position.y = origin.y + dy
	emits('dragging', { position: { ...position }, originalEvent: event })
}

const onPointerUp = (event) => {
	if (pointerId === null || event.pointerId !== pointerId) return
	if (node.value?.hasPointerCapture?.(pointerId)) {
		node.value.releasePointerCapture(pointerId)
	}
	pointerId = null
	dragging = false
	origin = { ...position }
	emits('drag-end', { position: { ...position }, originalEvent: event })
}

const notifyApp = () => {
	const payload =
		typeof props.replyPayload === 'function'
			? props.replyPayload({ position: { ...position } })
			: props.replyPayload
	emits('reply', {
		message: payload,
		position: { ...position },
		timestamp: Date.now()
	})
}
</script>
