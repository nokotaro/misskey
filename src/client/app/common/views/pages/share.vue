<template>
<div class="azibmfpleajagva420swmu4c3r7ni7iw">
	<h1>{{ $t('share-with', { name }) }}</h1>
	<div :class="{ fluid }">
		<mk-signin v-if="!$store.getters.isSignedIn"/>
		<mk-post-form v-else-if="!posted" :initial-text="template" :instant="true" @posted="posted = true"/>
		<p v-else class="posted"><fa :icon="['fal', 'check']"/></p>
	</div>
	<ui-button class="close" v-if="posted" @click="close">{{ $t('@.close') }}</ui-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('mobile/views/pages/share.vue'),
	data() {
		const params = new URLSearchParams(location.search);
		return {
			name: null,
			posted: false,
			text: params.get('text'),
			url: params.get('url'),
			title: params.get('title'),
			fluid: params.get('fluid')
		};
	},
	computed: {
		template(): string {
			let t = '';
			if (this.title && this.url) t += `【[${this.title}](${this.url})】\n`;
			if (this.title && !this.url) t += `【${this.title}】\n`;
			if (this.text) t += `${this.text}\n`;
			if (!this.title && this.url) t += `${this.url}`;
			return t.trim();
		}
	},
	methods: {
		close() {
			window.close();
		}
	},
	mounted() {
		this.$root.getMeta().then(meta => {
			this.name = meta.name;
		});
	}
});
</script>

<style lang="stylus" scoped>
.azibmfpleajagva420swmu4c3r7ni7iw
	> h1
		margin 8px 0
		color #555
		font-size 20px
		text-align center

	> div
		margin 0 auto
		max-width 588px

		&.fluid
			margin 0 8px
			max-width none

		> .posted
			display block
			margin 0 auto
			padding 64px
			text-align center
			background var(--bg)
			color var(--text)
			border-radius 6px
			width calc(100% - 32px)

	> .close
		display block
		margin 16px auto
		width calc(100% - 32px)
</style>
