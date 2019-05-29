<template>
<main class="max-height" @click="click">
	<mk-tag-cloud/>
</main>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
	created() {
		document.body.classList.add('max-height')
	},
	methods: {
		click(e: MouseEvent) {
			history.back();
		}
	},
	beforeDestroy() {
		document.body.classList.remove('max-height')
	}
})
</script>

<style lang="stylus">
.max-height
	height 100%
</style>


<style lang="stylus" scoped>
main > *
	align-items center
	display flex
	justify-content center
</style>
