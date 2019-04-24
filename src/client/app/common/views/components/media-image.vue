<template>
<div class="qjewsnkgzzxlxtzncydssfbgjibiehcy" v-if="image.isSensitive && hide && !$store.state.device.alwaysShowNsfw" @click="hide = false">
	<div>
		<b><fa :icon="['fal', 'exclamation-triangle']"/> {{ $t('sensitive') }}</b>
		<span>{{ $t('click-to-show') }}</span>
	</div>
</div>
<a class="gqnyydlzavusgskkfvwvjiattxdzsqlf" v-else
	ref="container"
	:href="image.url"
	:title="image.name"
	@click.prevent="onClick"
>
	<img class="cover" :src="src" ref="cover">
	<img class="contain" :src="src" ref="contain">
	<div>
		<div class="gif" v-if="image.type === 'image/gif'">GIF</div>
	</div>
</a>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import ImageViewer from './image-viewer.vue';
import { getStaticImageUrl } from '../../../common/scripts/get-static-image-url';

export default Vue.extend({
	i18n: i18n('common/views/components/media-image.vue'),
	props: {
		image: {
			type: Object,
			required: true
		},
		raw: {
			default: false
		}
	},
	data() {
		return {
			hide: true
		};
	}
	computed: {
		src(): string {
			return this.$store.state.device.disableShowingAnimatedImages
				? getStaticImageUrl(this.image.thumbnailUrl)
				: this.image.thumbnailUrl;
		}
	},
	mounted() {
		const rect = (this.$refs.container as HTMLAnchorElement).getBoundingClientRect();

		(this.$refs.cover as HTMLImageElement).style.filter = `drop-shadow(0 0 ${Math.max(rect.width, rect.height)} rgba(0,0,0,.5))`;
		(this.$refs.contain as HTMLImageElement).style.filter = `blur(${Math.max(rect.width, rect.height)})contrast(50%)opacity(50%)`;
	},
	methods: {
		onClick() {
			this.$root.new(ImageViewer, {
				image: this.image
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.gqnyydlzavusgskkfvwvjiattxdzsqlf
	display grid
	cursor zoom-in
	overflow hidden
	width 100%
	height 100%
	background-position center
	background-size contain
	background-repeat no-repeat

	> *
		grid-row 1
		grid-column 1
		height 100%
		width 100%

		&.contain
			filter drop-shadow(0px 0px 100vmax #0008)
			object-fit contain

		&.cover
			filter blur(100vmax) contrast(50%) opacity(50%)
			object-fit cover
			transition filter .2s ease

		> .gif
			background-color var(--text)
			border-radius 6px
			color var(--secondary)
			display inline-block
			font-family fot-rodin-pron, a-otf-ud-shin-go-pr6n, sans-serif
			font-size 14px
			font-weight 600
			left 12px
			opacity .5
			padding 0 6px
			text-align center
			top 12px
			pointer-events none

.qjewsnkgzzxlxtzncydssfbgjibiehcy
	display flex
	justify-content center
	align-items center
	background #111
	color #fff

	> div
		text-align center
		font-size 12px

		> *
			display block
</style>
