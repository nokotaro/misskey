<template>
<mfm-core v-bind="$attrs" class="havbbuyv" :class="{ nowrap: $attrs['nowrap'] }" v-once ref="ref"/>
</template>

<script lang="ts">
import Vue from 'vue';
import MfmCore from './mfm';

export default Vue.extend({
	components: {
		MfmCore
	}
});
</script>

<style lang="stylus" scoped>
.havbbuyv
	white-space pre-wrap

	&.nowrap
		white-space pre

	&:not(.nowrap) /deep/ > .emoji:only-child
		font-size 4em

	>>> .title
		display block
		margin-bottom 4px
		padding 4px
		font-family a-otf-midashi-go-mb31-pr6n, fot-rodin-pron, sans-serif
		font-size 1.5em
		font-weight 600
		text-align center
		background var(--mfmTitleBg)
		border-radius 4px

		.serif
			font-family a-otf-midashi-mi-ma31-pr6n, vdl-v7mincho, serif !important

	>>> .quote
		display block
		margin 8px
		padding 6px 0 6px 12px
		color var(--mfmQuote)
		border-left solid 3px var(--mfmQuoteLine)

	>>> .bubble
		display flex
		margin 8px

		&::before
			border-color transparent var(--faceDivider) transparent transparent
			border-style solid solid outset
			border-width 8px
			content ''
			height 0
			margin 12px 0 0
			order 1
			width 0

		> :first-child > .emoji:not(.custom):only-child
			font-size 2.5em
			height 2.5em
			line-height 1
			vertical-align middle

		> :last-child
			background var(--faceDivider)
			border-radius 8px
			flex 0 1 auto
			order 2
			padding 8px

		&::after
			content ''
			flex 1 1 auto
			order 3

	>>> pre code
		font-size 80%
</style>
