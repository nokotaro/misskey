<template>
<div class="izumiski">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover" :class="{ isMobile: $root.isMobile, first: r == null }" ref="popover">
		<div @click="choose(null)" :class="{ active: r == null }">
			<div><fa :icon="['fal', 'eye']" fixed-width/></div>
			<div>
				<span>{{ $t('unset') }}</span>
			</div>
		</div>
		<div @click="choose('0')" :class="{ active: r == '0' }">
			<div><fa :icon="['fal', 'baby']" fixed-width/></div>
			<div>
				<span>{{ $t('G') }}</span>
				<span>{{ $t('G-desc') }}</span>
			</div>
		</div>
		<div @click="choose('12')" :class="{ active: r == '12' }">
			<div><fa :icon="['fal', 'child']" fixed-width/></div>
			<div>
				<span>{{ $t('PG12') }}</span>
				<span>{{ $t('PG12-desc') }}</span>
			</div>
		</div>
		<div @click="choose('15')" :class="{ active: r == '15' }">
			<div><fa :icon="['fal', 'people-carry']" fixed-width/></div>
			<div>
				<span>{{ $t('R15+') }}</span>
				<span>{{ $t('R15+-desc') }}</span>
			</div>
		</div>
		<div @click="choose('18')" :class="{ active: r == '18' }">
			<div><fa :icon="['fal', 'person-booth']" fixed-width/></div>
			<div>
				<span>{{ $t('R18+') }}</span>
				<span>{{ $t('R18+-desc') }}</span>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import anime from 'animejs';

export default Vue.extend({
	i18n: i18n('common/views/components/rating-chooser.vue'),
	props: {
		source: {
			required: true
		},
		currentRating: {
			type: String,
			required: false
		}
	},
	data() {
		return {
			r: this.currentRating
		}
	},
	mounted() {
		this.$nextTick(() => {
			const popover = this.$refs.popover as any;

			const rect = this.source.getBoundingClientRect();
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			let left;
			let top;

			if (this.$root.isMobile) {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + (this.source.offsetHeight / 2);
				left = (x - (width / 2));
				top = (y - (height / 2));
			} else {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + this.source.offsetHeight;
				left = (x - (width / 2));
				top = y;
			}

			if (left + width > window.innerWidth) {
				left = window.innerWidth - width;
			}

			popover.style.left = left + 'px';
			popover.style.top = top + 'px';

			anime({
				targets: this.$refs.backdrop,
				opacity: 1,
				duration: 100,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.popover,
				opacity: 1,
				scale: [0.5, 1],
				duration: 500
			});
		});
	},
	methods: {
		choose(rating) {
			this.$emit('chosen', rating);
			this.destroyDom();
		},
		close() {
			(this.$refs.backdrop as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.backdrop,
				opacity: 0,
				duration: 200,
				easing: 'linear'
			});

			(this.$refs.popover as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.popover,
				opacity: 0,
				scale: 0.5,
				duration: 200,
				easing: 'easeInBack',
				complete: () => this.destroyDom()
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.izumiski
	position initial

	> .backdrop
		position fixed
		top 0
		left 0
		z-index 10000
		width 100%
		height 100%
		background var(--modalBackdrop)
		opacity 0

	> .popover
		$bgcolor = var(--popupBg)
		position absolute
		z-index 10001
		background $bgcolor
		border-radius 4px
		box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
		transform scale(0.5)
		opacity 0

		&:not(.isMobile)
			$arrow-size = 10px

			margin-top $arrow-size
			transform-origin center -($arrow-size)

			&:before
				content ""
				display block
				position absolute
				top -($arrow-size * 2)
				left s('calc(50% - %s)', $arrow-size)
				border-top solid $arrow-size transparent
				border-left solid $arrow-size transparent
				border-right solid $arrow-size transparent
				border-bottom solid $arrow-size $bgcolor

			&.first::before
				border-bottom solid $arrow-size var(--primary)

		> div
			display flex
			padding 8px 14px
			font-size 12px
			color var(--popupFg)
			cursor pointer

			&:hover
				background var(--faceClearButtonHover)

			&:active
				background var(--faceClearButtonActive)

			&.active
				color var(--primaryForeground)
				background var(--primary)

				&:first-child
					border-radius 4px 4px 0 0

				&:last-child
					border-radius 0 0 4px 4px

			> *
				user-select none
				pointer-events none

			> *:first-child
				display flex
				justify-content center
				align-items center
				margin-right 10px

			> *:last-child
				flex 1 1 auto

				> span:first-child
					display block
					font-family fot-rodin-pron, a-otf-ud-shin-go-pr6n, sans-serif
					font-weight 600

				> span:last-child:not(:first-child)
					opacity 0.6
</style>
