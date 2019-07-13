<template>
<div class="omechnps" v-if="!fetching && user">
	<div class="is-suspended" v-if="user.isSuspended" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
		<fa :icon="['fal', 'exclamation-triangle']"/> {{ $t('@.user-suspended') }}
	</div>
	<div class="is-remote" v-if="user.host != null" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
		<fa :icon="['fal', 'exclamation-triangle']"/> {{ $t('@.is-remote-user') }}<a :href="user.url || user.uri" rel="nofollow noopener" target="_blank">{{ $t('@.view-on-remote') }}</a>
	</div>
	<div class="main">
		<x-header class="header" :user="user"/>
		<router-view :user="user"></router-view>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import confetti from 'canvas-confetti';
import i18n from '../../../../i18n';
import parseAcct from '../../../../../../misc/acct/parse';
import Progress from '../../../../common/scripts/loading';
import XHeader from './user.header.vue';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XHeader
	},
	data() {
		return {
			fetching: true,
			user: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;
			Progress.start();
			this.$root.api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;
				Progress.done();

				const now = new Date();
				const [today] = new Date(now.valueOf() - now.getTimezoneOffset() * 60000).toISOString().split('T');
				const [, todayMonth, todayDay] = today.split('-');
				if (!this.$store.state.device.reduceMotion && user.profile && user.profile.birthday && user.profile.birthday.endsWith(['', todayMonth, todayDay].join('-'))) {
					const end = Date.now() + 15000;
					const base = { spread: 60 };
					let count = 0;

					const frame = () => {
						if (!(count++ % 15)) {
							for (const option of [{
								...base,
								angle: 60,
								origin: { x: 0 }
							}, {
								...base,
								angle: 120,
								origin: { x: 1 }
							}]) {
								confetti(option);
							}
						}

						if (Date.now() < end) {
							requestAnimationFrame(frame);
						}
					};

					frame();
				}
			}).catch(() => {
				this.fetching = false;
				Progress.done();
			});
		},

		warp(date) {
			(this.$refs.tl as any).warp(date);
		}
	}
});
</script>

<style lang="stylus" scoped>
.omechnps
	width 100%
	margin 0 auto

	> .is-suspended
	> .is-remote
		margin-bottom 16px
		padding 14px 16px
		font-size 14px

		&.round
			border-radius 6px

		&.shadow
			box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

		&.is-suspended
			color var(--suspendedInfoFg)
			background var(--suspendedInfoBg)

		&.is-remote
			color var(--remoteInfoFg)
			background var(--remoteInfoBg)

		> a
			font-family fot-rodin-pron, a-otf-ud-shin-go-pr6n, sans-serif
			font-weight 600

	> .main
		> .header
			margin-bottom 16px
</style>
