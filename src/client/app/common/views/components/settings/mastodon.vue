<template>
<ui-card>
	<template #title><fa :icon="['fab', 'mastodon']"/> Mastodon</template>

	<section>
		<header><fa :icon="['fal', 'wind']"/> Mirror</header>
		<p v-if="$store.state.i.mastodon">{{ $t('connected-to') }}: <a :href="$store.state.i.mastodon.url" rel="nofollow noopener" target="_blank">@{{ $store.state.i.mastodon.username }}@{{ $store.state.i.mastodon.hostname }}</a></p>
		<ui-button v-if="$store.state.i.mastodon" @click="disconnect">{{ $t('disconnect') }}</ui-button>
		<ui-button v-else @click="connect">{{ $t('connect') }}</ui-button>
	</section>
</ui-card>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { apiUrl } from '../../../../config';

export default Vue.extend({
	i18n: i18n('common/views/components/settings/integration.vue'),

	data() {
		return {
			apiUrl,
			form: null
		};
	},

	mounted() {
		document.cookie = `i=${this.$store.state.i.token}`;
		this.$watch('$store.state.i', () => {
			if (this.form)
				this.form.close();
		}, {
			deep: true
		});
	},

	methods: {
		connect() {
			this.$root.dialog({
				title: this.$t('hostname'),
				input: {}
			}).then(({ canceled, result }) => {
				if (canceled) return;

				this.form = window.open(`${apiUrl}/connect/mastodon/${encodeURIComponent(result)}`,
					'connect_window',
					'height=570, width=520');
			});
		},

		disconnect() {
			window.open(`${apiUrl}/disconnect/mastodon`,
				'disconnect_window',
				'height=570, width=520');
		},
	}
});
</script>
