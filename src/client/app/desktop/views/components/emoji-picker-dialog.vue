<template>
<div class="gcafiosrssbtbnbzqupfmglvzgiaipyv">
	<x-picker @chosen="chosen"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import contains from '../../../common/scripts/contains';

export default Vue.extend({
	components: {
		XPicker: () => import('../../../common/views/components/emoji-picker.vue').then(m => m.default)
	},

	props: {
		x: {
			type: Number,
			required: false,
			default: 0
		},
		y: {
			type: Number,
			required: false,
			default: 0
		},
		z: {
			type: Number,
			required: false,
			default: 13000
		},
		w: {
			type: String,
			required: false,
			default: 'absolute'
		}
	},

	mounted() {
		this.$nextTick(() => {
			this.$el.style.left = `${this.x}px`;
			this.$el.style.top = `${this.y}px`;
			this.$el.style.zIndex = this.z;
			this.$el.style.position = this.w;

			for (const el of Array.from(document.querySelectorAll('body *'))) {
				el.addEventListener('mousedown', this.onMousedown);
			}
		});
	},

	methods: {
		onMousedown(e) {
			e.preventDefault();
			if (!contains(this.$el, e.target) && (this.$el != e.target)) this.close();
			return false;
		},

		chosen(emoji) {
			this.$emit('chosen', emoji);
			this.close();
		},

		close() {
			for (const el of Array.from(document.querySelectorAll('body *'))) {
				el.removeEventListener('mousedown', this.onMousedown);
			}

			this.$emit('closed');
			this.destroyDom();
		}
	}
});
</script>

<style lang="stylus" scoped>
.gcafiosrssbtbnbzqupfmglvzgiaipyv
	box-shadow 0 2px 12px 0 rgba(0, 0, 0, 0.3)

</style>
