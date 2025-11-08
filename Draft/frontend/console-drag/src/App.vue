<style scoped>
:global(html),
:global(body),
:global(#app) {
	margin: 0;
	padding: 0;
	height: 100%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #e5e7eb;
}

.container {
	width: 96vw;
	height: 96vh;
	border-radius: 18px;
	border: 1px solid #111827;
	display: grid;
	grid-template-rows: 11vh 1fr 9vh;
	background: linear-gradient(160deg, #f9fafb 0%, #eef2ff 100%);
	overflow: hidden;
	box-shadow: 0 20px 40px rgba(15, 23, 42, 0.15);
}

header,
footer {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	color: #1f2937;
	background: rgba(255, 255, 255, 0.8);
	backdrop-filter: blur(8px);
}

header {
	font-size: 1.75rem;
	font-weight: 600;
}

footer {
	font-size: 1rem;
	font-weight: 500;
}

main {
	display: flex;
	align-items: stretch;
	justify-content: space-between;
	gap: 1.75rem;
	padding: 1.75rem;
	background: radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.95), rgba(219, 234, 254, 0.85));
}

.canvas {
	position: relative;
	flex: 1 1 0;
	border-radius: 16px;
	background: rgba(255, 255, 255, 0.65);
	box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.1);
	overflow: hidden;
	min-height: 100%;
}

.control-panel {
	flex: 0 0 clamp(260px, 26vw, 360px);
	align-self: stretch;
	display: flex;
	flex-direction: column;
	gap: 1.2rem;
	padding: 1.35rem 1.5rem;
	border-radius: 16px;
	background: rgba(15, 23, 42, 0.08);
	backdrop-filter: blur(18px);
	border: 1px solid rgba(148, 163, 184, 0.4);
	box-shadow: 0 18px 34px rgba(15, 23, 42, 0.25);
	color: #0f172a;
}

.control-panel h2 {
	margin: 0;
	font-size: 1.35rem;
	font-weight: 700;
}

.panel-section {
	display: flex;
	flex-direction: column;
	gap: 0.65rem;
	font-size: 0.88rem;
}

.panel-section label,
.panel-section h3 {
	font-size: 0.85rem;
	font-weight: 600;
	color: #0f172a;
}

.panel-section textarea,
.panel-section select,
.panel-section input {
	width: 100%;
	border-radius: 10px;
	border: 1px solid rgba(148, 163, 184, 0.45);
	padding: 0.6rem 0.75rem;
	font-size: 0.88rem;
	font-family: inherit;
	background: rgba(255, 255, 255, 0.92);
	box-shadow: inset 0 1px 1px rgba(15, 23, 42, 0.05);
}

.panel-actions {
	display: flex;
	gap: 0.75rem;
	flex-wrap: wrap;
}

.panel-btn {
	padding: 0.5rem 1rem;
	border-radius: 999px;
	border: none;
	font-weight: 600;
	font-size: 0.85rem;
	color: #0f172a;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(226, 232, 240, 0.95));
	box-shadow: 0 10px 20px rgba(15, 23, 42, 0.18);
	cursor: pointer;
	transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.panel-btn:hover {
	transform: translateY(-1px);
	box-shadow: 0 14px 26px rgba(15, 23, 42, 0.22);
}

.panel-btn:active {
	transform: translateY(0);
}

.status-grid {
	display: grid;
	grid-template-columns: 1fr;
	row-gap: 0.5rem;
	font-size: 0.85rem;
}

.status-grid strong {
	font-weight: 700;
}

.position-inputs {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.65rem;
}

.position-inputs input {
	text-align: right;
}

.log-list {
	margin: 0;
	padding: 0;
	list-style: none;
	max-height: 190px;
	overflow-y: auto;
	scrollbar-width: thin;
}

.log-item {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0.35rem 0.6rem;
	font-size: 0.78rem;
	padding: 0.4rem 0;
	border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.log-item:last-child {
	border-bottom: none;
}

.log-item .time {
	font-variant-numeric: tabular-nums;
	color: #475569;
}

.log-item .summary {
	color: #0f172a;
}

.slot-footer {
	margin-top: 0.8rem;
	padding: 0.45rem 0.65rem;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.18);
	font-size: 0.78rem;
	display: inline-flex;
	align-items: center;
	gap: 0.55rem;
}

.slot-footer button {
	padding: 0.25rem 0.65rem;
	border-radius: 999px;
	border: none;
	font-size: 0.75rem;
	font-weight: 600;
	background: rgba(255, 255, 255, 0.92);
	color: #0f172a;
	cursor: pointer;
}

.slot-footer span {
	font-variant-numeric: tabular-nums;
}
</style>

<template>
	<div class="container">
		<header>Movable Item</header>
		<main>
			<section class="canvas">
				<MovableItem :initial-position="positionPreset" :title="itemTitle" :app-message="appMessage"
					:theme="activeTheme" :reply-label="'回复 App：收到啦'" :reply-payload="replyPayloadFactory"
					@drag-start="handleDragStart" @dragging="handleDragging" @drag-end="handleDragEnd" @reply="handleReply">
					<template #default>
						<p>{{ componentNote }}</p>
						<p>当前状态：<strong>{{ dragState }}</strong></p>
					</template>
					<template #footer="{ position, notifyApp }">
						<div class="slot-footer">
							<button type="button" @click="notifyApp">slot 回复</button>
							<span>slot 坐标：{{ Math.round(position.x) }}, {{ Math.round(position.y) }}</span>
						</div>
					</template>
				</MovableItem>
			</section>

			<aside class="control-panel">
				<h2>App 控制台</h2>

				<section class="panel-section">
					<label for="message-draft">发送给组件的消息</label>
					<textarea id="message-draft" v-model="messageDraft" rows="3" placeholder="输入要发送给组件的消息"></textarea>
					<div class="panel-actions">
						<button class="panel-btn" type="button" @click="sendMessage">发送到组件</button>
						<button class="panel-btn" type="button" @click="clearMessage">清空消息</button>
					</div>
				</section>

				<section class="panel-section">
					<h3>状态面板</h3>
					<div class="status-grid">
						<div><strong>组件反馈：</strong> <span>{{ replyMessage || '等待组件回复…' }}</span></div>
						<div><strong>实时坐标：</strong> <span>{{ Math.round(livePosition.x) }}, {{ Math.round(livePosition.y) }}</span>
						</div>
						<div><strong>拖拽状态：</strong> <span>{{ dragState }}</span></div>
					</div>
				</section>

				<section class="panel-section">
					<label for="theme">主题风格</label>
					<select id="theme" v-model.number="selectedTheme">
						<option v-for="(option, idx) in themeOptions" :key="option.label" :value="idx">
							{{ option.label }}
						</option>
					</select>
					<div class="position-inputs">
						<label>起始 X<input type="number" v-model.number="positionPreset.x" /></label>
						<label>起始 Y<input type="number" v-model.number="positionPreset.y" /></label>
					</div>
					<div class="panel-actions">
						<button class="panel-btn" type="button" @click="randomizePosition">随机坐标</button>
						<button class="panel-btn" type="button" @click="resetPosition">复位</button>
					</div>
				</section>

				<section class="panel-section">
					<h3>事件流</h3>
					<ul class="log-list">
						<li v-for="entry in eventLog" :key="entry.id" class="log-item">
							<span class="time">{{ entry.time }}</span>
							<span class="summary">{{ entry.type }}｜{{ entry.summary }}</span>
						</li>
					</ul>
				</section>
			</aside>
		</main>

		<footer>
			<span>powered by Yazs</span>
		</footer>
	</div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import MovableItem from './components/movableItem.vue'

const itemTitle = ref('移动便签：双向通信示例')
const componentNote = ref('通过 props 接收 App 消息，通过事件向 App 回复。拖拽我体验完整交互。')

const positionPreset = reactive({ x: 80, y: 120 })
const livePosition = ref({ ...positionPreset })
const dragState = ref('静止')

const appMessage = ref('App 问候：欢迎体验 MovableItem 组件！')
const messageDraft = ref('App 这边已就绪，欢迎拖拽探索。')
const replyMessage = ref('')

const themeOptions = [
	{
		label: '海盐蓝',
		background: 'linear-gradient(135deg, #7f7fd5 0%, #86a8e7 45%, #91eae4 100%)',
		text: '#ffffff'
	},
	{
		label: '暖阳橙',
		background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
		text: '#1f2937'
	},
	{
		label: '极夜紫',
		background: 'linear-gradient(135deg, #5c258d 0%, #4389a2 100%)',
		text: '#fef9ff'
	}
]

const selectedTheme = ref(0)
const activeTheme = computed(() => themeOptions[selectedTheme.value] ?? themeOptions[0])

const eventLog = ref([])
let logCounter = 0

const summariseDetail = (detail) => {
	if (!detail) return '—'
	if (typeof detail === 'string') return detail
	if (detail.message && detail.position) {
		const { x, y } = detail.position
		return `${detail.message} @ (${Math.round(x)}, ${Math.round(y)})`
	}
	if (detail.position) {
		const { x, y } = detail.position
		return `坐标 (${Math.round(x)}, ${Math.round(y)})`
	}
	if (detail.label) return `切换至 ${detail.label}`
	try {
		return JSON.stringify(detail)
	} catch (error) {
		return String(detail)
	}
}

const pushLog = (type, detail) => {
	eventLog.value.unshift({
		id: `${Date.now()}-${logCounter++}`,
		time: new Date().toLocaleTimeString(),
		type,
		summary: summariseDetail(detail)
	})
	if (eventLog.value.length > 12) {
		eventLog.value.length = 12
	}
}

const sendMessage = () => {
	const text = messageDraft.value.trim() || '（空消息）'
	appMessage.value = text
	pushLog('App → 组件', text)
}

const clearMessage = () => {
	messageDraft.value = ''
	appMessage.value = ''
	pushLog('App', '已清空发送消息')
}

const randomizePosition = () => {
	positionPreset.x = Math.round(Math.random() * 280)
	positionPreset.y = Math.round(Math.random() * 240)
	pushLog('App', { position: { ...positionPreset } })
}

const resetPosition = () => {
	positionPreset.x = 80
	positionPreset.y = 120
	pushLog('App', { position: { ...positionPreset } })
}

const replyPayloadFactory = ({ position }) =>
	`组件坐标：(${Math.round(position.x)}, ${Math.round(position.y)})，已成功回执 App。`

const handleDragStart = ({ position }) => {
	dragState.value = '开始拖拽'
	pushLog('组件 drag-start', { position })
}

const handleDragging = ({ position }) => {
	livePosition.value = { ...position }
	dragState.value = '拖拽中'
}

const handleDragEnd = ({ position }) => {
	livePosition.value = { ...position }
	dragState.value = '已就位'
	pushLog('组件 drag-end', { position })
}

const handleReply = ({ message, position }) => {
	if (typeof message === 'string') {
		replyMessage.value = message
	} else if (message) {
		replyMessage.value = JSON.stringify(message)
	} else {
		replyMessage.value = '组件发送了空消息'
	}
	pushLog('组件 → App', { message, position })
}

watch(selectedTheme, (idx) => {
	pushLog('主题', { label: themeOptions[idx]?.label ?? '未知主题' })
})

watch(
	() => [positionPreset.x, positionPreset.y],
	([x, y]) => {
		livePosition.value = { x, y }
	},
	{ immediate: true }
)
</script>
