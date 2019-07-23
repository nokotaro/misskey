<template>
<router-view id="app" v-hotkey.global="keymap"></router-view>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	computed: {
		keymap(): any {
			return {
				'h|slash': this.help,
				'd': this.dark
			};
		}
	},

	methods: {
		help() {
			window.open('https://twista-docs.283.cloud', '_blank', 'noopener');
		},

		dark() {
			this.$store.commit('device/set', {
				key: 'darkmode',
				value: !this.$store.state.device.darkmode
			});
		}
	}
});
</script>
