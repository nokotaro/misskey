<template>
<div class="mk-renote-form">
	<mk-note-preview class="preview" :note="note"/>
	<div v-if="visibility == 'specified'" class="visible-users">
		<span class="title">
			<fa :icon="['fal', 'user-friends']" class="ako"/>
			<span>{{ $t('@.send-to') }}</span>
		</span>
		<a class="visible-user" @click="removeVisibleUser(u)" v-for="u in visibleUsers">
			<div><fa :icon="['fal', 'user-minus']" fixed-width/></div>
			<span>
				<mk-avatar :user="u"/>
				<mk-user-name :user="u"/>
			</span>
		</a>
		<a @click="addVisibleUser">
			<fa :icon="['fal', 'user-plus']" class="ako"/>
		</a>
	</div>
	<template v-if="!quote">
		<footer>
			<div class="buttons">
				<a class="quote" v-if="!quote" @click="onQuote">{{ $t('quote') }}</a>
				<ui-button class="button cancel" inline @click="cancel">{{ $t('cancel') }}</ui-button>
				<ui-buttons>
					<ui-button class="button ok" inline primary :disabled="wait" grow="1" @click="ok">
						<x-visibility-icon class="inline" :v="visibility" :localOnly="localOnly" :fixedWidth="true" :altColor="true"/>
						{{ $t('renote') }}
					</ui-button>
					<div ref="visibilityButton">
						<ui-button class="button ok" inline primary :disabled="wait" shrink="1" @click="setVisibility">
							<fa :icon="['fal', 'angle-down']" fixed-width/>
						</ui-button>
					</div>
				</ui-buttons>
			</div>
		</footer>
	</template>
	<template v-if="quote">
		<mk-post-form ref="form" :renote="note" @posted="onChildFormPosted"/>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import MkVisibilityChooser from '../../../common/views/components/visibility-chooser.vue';
import XVisibilityIcon from '../../../common/views/components/visibility-icon.vue';
import { erase } from '../../../../../prelude/array';

export default Vue.extend({
	i18n: i18n('desktop/views/components/renote-form.vue'),

	components: {
		MkVisibilityChooser,
		XVisibilityIcon
	},

	props: {
		note: {
			type: Object,
			required: true
		}
	},

	data() {
		return {
			wait: false,
			quote: false,
			visibility: 'public',
			visibleUsers: [],
			localOnly: false
		};
	},

	methods: {
		ok() {
			this.wait = true;
			this.$root.api('notes/create', {
				renoteId: this.note.id,
				visibility: this.visibility,
				localOnly: this.localOnly
			}).then(data => {
				this.$emit('posted');
				this.$notify(this.$t('success'));
			}).catch(err => {
				this.$notify(this.$t('failure'));
			}).then(() => {
				this.wait = false;
			});
		},

		setVisibility() {
			const w = this.$root.new(MkVisibilityChooser, {
				source: this.$refs.visibilityButton,
				currentVisibility: this.visibility,
				currentLocalOnly: this.localOnly,
				dialog: true
			});
			w.$once('chosen', this.applyVisibility);
		},

		applyVisibility(v :string) {
			const m = v.match(/^local-(.+)/);
			if (m) {
				this.localOnly = true;
				this.visibility = m[1];
			} else {
				this.localOnly = false;
				this.visibility = v;
			}
		},

		addVisibleUser() {
			this.$root.dialog({
				title: this.$t('@.enter-username'),
				user: true
			}).then(({ canceled, result: user }) => {
				if (canceled) return;
				this.visibleUsers.push(user);
			});
		},

		removeVisibleUser(user) {
			this.visibleUsers = erase(user, this.visibleUsers);
		},

		cancel() {
			this.$emit('canceled');
		},

		onQuote() {
			this.quote = true;

			this.$nextTick(() => {
				(this.$refs.form as any).focus();
			});
		},

		onChildFormPosted() {
			this.$emit('posted');
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-renote-form
	> .preview
	> .visibleUsers
		margin 16px 22px

		&.visible-users
			align-items center
			display flex
			flex-flow wrap
			gap 8px
			margin 8px 22px

			.ako
				height 32px
				margin 0 6px
				padding 6px 0
				vertical-align bottom

			> .title
				color var(--text)
				padding 0 6px 0 0

				> span
					vertical-align 4px

			> .visible-user
				align-items center
				border solid 1px
				border-radius 16px
				display flex
				height 32px
				overflow hidden

				&:hover
					> *:first-child
						padding 0 0 0 2px
						width 32px

					> *:last-child
						padding 0 2px 0 0

				> *
					align-items center
					display flex
					justify-content center
					transition all .2s ease

					&:first-child
						align-items center
						background currentColor
						display flex
						height 100%
						justify-content center
						width 0

						> svg
							color var(--secondary)
					
					&:last-child
						flex 1 0 auto
						gap 4px
						margin 0 8px
						padding 0 18px 0 16px

						> .mk-avatar
							height 24px
							width 24px

	> footer
		height 72px
		background var(--desktopRenoteFormFooter)

		> .buttons
			display flex
			padding 12px
			align-items center

			.inline
				display inline

			> .quote
				display block
				margin-right auto
				margin-left 8px

			> .button
				display block
				margin 4px
</style>
