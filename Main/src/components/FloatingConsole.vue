<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
	fmsg: {
		type: String,
		default: "No Msg"
	}
})

const emits = defineEmits(["clean", "run"])

const emitClean = (e) => {
	emit("clean", "Clean Now ")
}

const parentMsg = ref("no text");

watch(
	() => props.fmsg,
	(e) => {
		parentMsg.value = e
	}
)

// watch(

// )

const boxes = ref([
	{ x: 100, y: 100 },
	// { x: 20, y: 11 }
])
// const computedBoxes = compute

let moving = false;
const offset = ref({ x: 0, y: 0 })
let idx = 0;

const onMousedown = (e) => {
	if (moving) return
	moving = true
	const item = e.currentTarget || e.target.closest('.item')
	idx = +item.dataset.index
	// TODO 理解以下函数坐标的操作
	const rect = item.getBoundingClientRect()
	console.log(rect.left, rect.right)
	offset.value.x = e.clientX - rect.left
	offset.value.y = e.clientY - rect.top
	document.addEventListener('mousemove', onMousemove)
	document.addEventListener('mouseup', onMouseUp)
}

const onMousemove = (e) => {
	if (!moving) return
	// const box = boxes.value[idx]
	boxes.value[idx].x = e.clientX - offset.value.x;
	boxes.value[idx].y = e.clientY - offset.value.y;


}

const onMouseUp = () => {
	moving = false
	document.removeEventListener("mousemove", onMousemove)
	document.removeEventListener("mouseup", onMouseUp)
}


/**
 * @function 显隐逻辑
 */
const exit = (e) => {
	idx = +e.target.closest('.item')?.dataset?.index
	boxes.value.splice(idx, 1);
	// showConsole.value = false;
}


/**
 * 与app.vue联动添加console逻辑
 */

const addConsole = (X, Y) => {
	boxes.value.push({
		x: X,
		y: Y
	})
	// console.log("adadad")
}

/**
 * 逻辑控制台
 */
const consoleLog = ref([1, 2]);
const pushLog = (e) => {
	consoleLog.value.push(e)
}



/**
 * 统一管控对外暴露的接口
 */
defineExpose({
	addConsole,
	pushLog
})

</script>

<template>


	<div class="item" v-for="(box, index) in boxes" :key="index" :data-index="index"
		:style="{ left: box.x + 'px', top: box.y + 'px' }" @mousedown="onMousedown">
		<div class="main">
			<div style="border-bottom: 1px black solid;">
				<!-- TODO 修改为相对样式 -->
				<!-- <div class="msg-input">{{ parentMsg }}</div> -->
				<div class="msg-input">执行控制台: {{ parentMsg }}</div>
				<button @click="$emit('clean')" class="clean-button">C</button>
				<button class="exit-button" @click="exit">X</button>
			</div>
			<div>
				<ul class="console-interactive">
					<!-- <li v-for="val in ">{{ parentMsg }}</li> -->
					<li v-for="log in consoleLog">{{ log }}</li>
				</ul>

			</div>
		</div>

	</div>

	<!-- </div> -->


</template>


<style scoped>
.item {
	height: 200px;
	width: 300px;
	border: 1px red dashed;
	position: absolute;
	user-select: none;
}

.item:hover {
	cursor: grabbing;
}

.main {
	display: grid;
	grid-template-rows: 30px 1fr;
}

.msg-input {
	position: absolute;
	left: 0;
	top: 0;
	margin: 5px;
}

.exit-button {
	position: absolute;
	right: 0;
	top: 0;
	margin: 5px
}

.clean-button {
	position: absolute;
	right: 30px;
	margin: 5px;
	top: 0;
}

.console-interactive {
	margin-top: 0;
	margin: 5px;
	height: 160px;
	background-color: white;
	border: 1px black solid;
	overflow-y: scroll;

}
</style>