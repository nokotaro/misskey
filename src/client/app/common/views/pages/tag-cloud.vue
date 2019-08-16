<template>
<main class="max-height" @click="click">
	<mk-tag-cloud :limit="limitNumber" :range="rangeNumber"/>
</main>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
	props: {
		limit: {
			type: Number,
			required: false
		},
		range: {
			type: Number,
			required: false
		}
	},
	data() {
		return {
			limitNumber: this.limit,
			rangeNumber: this.range,
		};
	},
	created() {
		document.body.classList.add('max-height')
		if (location.search.length > 1) {
			const query = location.search.substring(1).split('&').map(x => x.split('=')).reduce((a, [k, v]) => (a[k] = v, a), Object.create(null));

			if ('limit' in query) {
				const limitNumber = Number(query.limit);

				if (!Number.isNaN(limitNumber)) {
					this.limitNumber = Number(query.limit);
				}
			}

			if ('range' in query) {
				const rangeNumber = Number(query.range);

				if (!Number.isNaN(rangeNumber)) {
					this.rangeNumber = Number(query.range);
				}
			}
		}
	},
	methods: {
		click(e: MouseEvent) {
			if (!(e.target instanceof HTMLAnchorElement))
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
