<template>
<div class="mk-media-list">
	<template v-for="media in mediaList.filter(media => !previewable(media))">
		<x-banner :media="media" :key="media.id"/>
	</template>
	<div v-if="count" class="grid-container" ref="container">
		<div :data-count="count" ref="grid">
			<template v-for="media in mediaList">
				<mk-media-video v-if="media.type.startsWith('video')" :video="media" :key="media.id"/>
				<x-image v-else-if="media.type.startsWith('image') && $store.state.settings.dynamicView" :image="media" :key="media.id" :raw="raw" :count="count"/>
				<x-image-legacy v-else-if="media.type.startsWith('image')" :image="media" :key="media.id" :raw="raw" :count="count"/>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XBanner from './media-banner.vue';
import XImage from './media-image.vue';
import XImageLegacy from './media-image-legacy.vue';

export default Vue.extend({
	components: {
		XBanner,
		XImage,
		XImageLegacy
	},
	props: {
		mediaList: {
			required: true
		},
		raw: {
			default: false
		}
	},
	computed: {
		count(): number {
			return this.mediaList.filter(this.previewable).length;
		}
	},
	mounted() {
		//#region for Safari bug
		if (this.$refs.grid) {
			if (this.$refs.container instanceof HTMLElement) {
				const { height } = this.$refs.container.getBoundingClientRect();

				if (height) {
					this.$refs.grid.style.height = `${height}px`;

					return;
				}
			}

			const half = navigator.vendor === 'Apple Computer, Inc.' && [3, 4].includes(this.count);

			this.$refs.grid.style.height =
				`${half ? 'calc(' : ''}${
					this.$refs.grid.clientHeight ? `${this.$refs.grid.clientHeight}px` :
					'netscape' in window ? '' : '128px'
				}${half ? '/2)' : ''}`;
		}
		//#endregion
	},
	methods: {
		previewable(file) {
			return file.type.startsWith('video') || file.type.startsWith('image');
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-media-list
	> .grid-container
		width 100%
		margin-top 4px

		&:before
			content ''
			display block
			padding-top 56.25% // 16:9

		> div
			position absolute
			top 0
			right 0
			bottom 0
			left 0
			display grid
			grid-gap 4px

			> *
				overflow hidden
				border-radius 4px

			&[data-count="1"]
				grid-template-rows 1fr

			&[data-count="2"]
				grid-template-columns 1fr 1fr
				grid-template-rows 1fr

			&[data-count="3"]
				grid-template-columns 1fr 0.5fr
				grid-template-rows 1fr 1fr

				> *:nth-child(1)
					grid-row 1 / 3

				> *:nth-child(3)
					grid-column 2 / 3
					grid-row 2 / 3

			&[data-count="4"]
				grid-template-columns 1fr 1fr
				grid-template-rows 1fr 1fr

			> *:nth-child(1)
				grid-column 1 / 2
				grid-row 1 / 2

			> *:nth-child(2)
				grid-column 2 / 3
				grid-row 1 / 2

			> *:nth-child(3)
				grid-column 1 / 2
				grid-row 2 / 3

			> *:nth-child(4)
				grid-column 2 / 3
				grid-row 2 / 3
</style>
