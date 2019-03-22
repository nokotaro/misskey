<template>
<mk-ui>
	<p v-if="fetching">{{ $t('@.loading') }}</p>
	<b-card v-else :header="name">
		<b-form @submit.prevent="onSubmit" autocomplete="off">
			<b-form-group :label="$t('@.dev.app-secret')">
				<b-input :value="secret" readonly/>
			</b-form-group>
			<b-form-group :label="$t('@.dev.app-name')" :description="$t('@.dev.app-name-desc')">
				<b-form-input v-model="name" type="text" :placeholder="$t('@.dev.app-name-ex')" autocomplete="off" required/>
			</b-form-group>
			<b-form-group :label="$t('@.dev.app-overview')" :description="$t('@.dev.app-overview-desc')">
				<b-textarea v-model="description" :placeholder="$t('@.dev.app-overview-ex')" autocomplete="off" required></b-textarea>
			</b-form-group>
			<b-form-group :label="$t('@.dev.callback-url')">
				<b-input v-model="cb" type="url" placeholder="ex) https://your.app.example.com/callback.php" autocomplete="off"/>
			</b-form-group>
			<b-card :header="$t('@.dev.authority')">
				<b-form-group :description="$t('@.dev.authority-desc')">
					<b-alert show variant="warning"><fa icon="exclamation-triangle"/> {{ $t('@.dev.authority-warning') }}</b-alert>
					<b-form-checkbox-group v-model="permission" stacked>
						<b-form-checkbox value="account-read">{{ $t('@.dev.account-read') }}</b-form-checkbox>
						<b-form-checkbox value="account-write">{{ $t('@.dev.account-write') }}</b-form-checkbox>
						<b-form-checkbox value="note-write">{{ $t('@.dev.note-write') }}</b-form-checkbox>
						<b-form-checkbox value="reaction-write">{{ $t('@.dev.reaction-write') }}</b-form-checkbox>
						<b-form-checkbox value="following-write">{{ $t('@.dev.following-write') }}</b-form-checkbox>
						<b-form-checkbox value="drive-read">{{ $t('@.dev.drive-read') }}</b-form-checkbox>
						<b-form-checkbox value="drive-write">{{ $t('@.dev.drive-write') }}</b-form-checkbox>
						<b-form-checkbox value="notification-read">{{ $t('@.dev.notification-read') }}</b-form-checkbox>
						<b-form-checkbox value="notification-write">{{ $t('@.dev.notification-write') }}</b-form-checkbox>
					</b-form-checkbox-group>
				</b-form-group>
			</b-card>
			<b-button type="submit" variant="primary">{{ $t('@update') }}</b-button>
		</b-form>
	</b-card>
	<hr>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
export default Vue.extend({
	i18n: i18n('dev/views/app.vue'),
	data() {
		return {
			fetching: true,
			secret: '',
			name: '',
			description: '',
			cb: '',
			permission: []
		};
	},
	watch: {
		$route: 'fetch'
	},
	mounted() {
		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;
			this.$root.api('app/show', {
				appId: this.$route.params.id
			}).then(app => {
				this.secret = app.secret;
				this.name = app.name;
				this.description = app.description;
				this.cb = app.cb;
				this.permission = app.permission;
				this.fetching = false;
			});
		},
		onSubmit() {
			this.$root.api('app/update', {
				appId: this.$route.params.id,
				name: this.name.length ? this.name : null,
				description: this.description.length ? this.description : null,
				permission: this.permission.length ? this.permission : null,
				callbackUrl: this.cb.length ? this.cb : null
			}).then(() => {
				alert(this.$t('@.dev.succeeded-to-update'));
			}).catch(() => {
				alert(this.$t('@.dev.failed-to-update'));
			});
		}
	}
});
</script>
