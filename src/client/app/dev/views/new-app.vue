<template>
<mk-ui>
	<b-card :header="$t('@.dev.header')">
		<b-form @submit.prevent="onSubmit" autocomplete="off">
			<b-form-group :label="$t('@.dev.app-name')" :description="$t('@.dev.app-name-desc')">
				<b-form-input v-model="name" type="text" :placeholder="$t('@.dev.app-name-ex')" autocomplete="off" required/>
			</b-form-group>
			<b-form-group :label="$t('@.dev.app-overview')" :description="$t('@.dev.app-overview-desc')">
				<b-textarea v-model="description" :placeholder="$t('@.dev.app-overview-ex')" autocomplete="off" required></b-textarea>
			</b-form-group>
			<b-form-group :label="$t('@.dev.callback-url')" :description="$t('@.dev.callback-url-desc')">
				<b-input v-model="cb" type="url" placeholder="ex) https://your.app.example.com/callback.php" autocomplete="off"/>
			</b-form-group>
			<b-card :header="$t('@.dev.authority')">
				<b-form-group :description="$t('@.dev.authority-desc')">
					<b-alert show variant="warning"><fa :icon="['fal', 'exclamation-triangle']"/> {{ $t('@.dev.authority-warning') }}</b-alert>
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
			<hr>
			<b-button type="submit" variant="primary">{{ $t('create-app') }}</b-button>
		</b-form>
	</b-card>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
export default Vue.extend({
	i18n: i18n('dev/views/new-app.vue'),
	data() {
		return {
			name: '',
			description: '',
			cb: '',
			permission: []
		};
	},
	methods: {
		onSubmit() {
			this.$root.api('app/create', {
				name: this.name,
				description: this.description,
				callbackUrl: this.cb,
				permission: this.permission
			}).then(() => {
				location.href = '/dev/apps';
			}).catch(() => {
				alert(this.$t('@.dev.failed-to-create'));
			});
		}
	}
});
</script>
