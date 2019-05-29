<template>
<main class="max-height">
	<mk-tag-cloud/>
</main>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
	created() {
		document.body.classList.add('max-height')
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
