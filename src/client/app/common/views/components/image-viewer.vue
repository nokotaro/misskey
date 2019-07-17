<template>
<div class="dkjvrdxtkvqrwmhfickhndpmnncsgacq" v-hotkey.global="keymap">
	<div class="bg" @click="close"></div>
	<img :src="image.url" :alt="image.name" :title="image.name" @click="close" ref="rotator"/>
	<div class="paginator left" @click="left"><fa :icon="['fal', 'angle-left']"/></div>
	<div class="paginator right" @click="right"><fa :icon="['fal', 'angle-right']"/></div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import anime from 'animejs';

export default Vue.extend({
	props: {
		images: {
			type: Array,
			required: true
		},
		index: {
			type: Number,
			required: true
		}
	},
	data() {
		return {
			i: this.index,
			queue: null
		};
	},
	computed: {
		image() {
			return this.images[this.i];
		},
		keymap() {
			return {
				'left': this.left,
				'right': this.right
			};
		}
	},
	mounted() {
		anime({
			targets: this.$el,
			opacity: 1,
			duration: 100,
			easing: 'linear'
		});
	},
	methods: {
		left() {
			if (this.queue) {
				this.queue.push(true);
			} else {
				this.queue = [];
				this.shift(true);
			}
		},
		right() {
			if (this.queue) {
				this.queue.push(false);
			} else {
				this.queue = [];
				this.shift(false);
			}
		},
		shift(isLeft: boolean, continued = false) {
			const self = this;
			const targets = this.$refs.rotator;

			anime({
				targets,
				duration: continued ? 30 : 300,
				rotateY: isLeft ? 90 : -90,
				easing: continued ? 'linear' : 'easeInSine',
				complete() {
					self.i = isLeft ? self.i ? --self.i : ~-self.images.length : ++self.i % self.images.length;

					anime({
						targets,
						duration: 0,
						rotateY: isLeft ? -90 : 90,
						easing: 'linear',
						complete() {
							const stack = self.queue.shift();
							const continues = stack !== undefined;

							anime({
								targets,
								duration: continues ? 30 : 300,
								rotateY: 0,
								easing: continues ? 'linear' : 'easeOutSine',
								complete() {
									if (continues) {
										self.shift(stack, true);
									} else {
										const stack = self.queue.shift();

										if (stack === undefined) {
											self.queue = null;
										} else {
											self.shift(stack);
										}
									}
								}
							})
						}
					})
				}
			});
		},
		close() {
			anime({
				targets: this.$el,
				opacity: 0,
				duration: 100,
				easing: 'linear',
				complete: () => this.destroyDom()
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.dkjvrdxtkvqrwmhfickhndpmnncsgacq
	position fixed
	z-index 2048
	top 0
	left 0
	width 100%
	height 100%
	opacity 0
	perspective 100vmax

	> .bg
		position fixed
		z-index 1
		top 0
		left 0
		width 100%
		height 100%
		background rgba(#000, 0.7)

	> img
		position fixed
		z-index 2
		top 0
		right 0
		bottom 0
		left 0
		max-width 100%
		max-height 100%
		margin auto
		cursor zoom-out
		image-orientation from-image
		transform-style preserve-3d

	> .paginator
		align-items center
		background var(--text)
		color var(--bg)
		display flex
		height 10vmax
		justify-content center
		margin -5vmax 0 0
		opacity .25
		position fixed
		top 50%
		width 5vmax
		z-index 3

		> svg
			height 4vmax
			width 1.5vmax

		&.left
			border-radius 0 100% 100% 0 / 50%
			left 0

			> svg
				margin 0 .5vmax 0 0

		&.right
			border-radius 100% 0 0 100% / 50%
			right 0

			> svg
				margin 0 0 0 .5vmax
</style>
