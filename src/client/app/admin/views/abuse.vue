<template>
<div>
	<ui-card>
		<template #title><fa :icon="faExclamationCircle"/> {{ $t('title') }}</template>
		<section class="fit-top">
			<sequential-entrance animation="entranceFromTop" delay="25">
				<div v-for="report in userReports" :key="report.id" class="haexwsjc">
					<ui-horizon-group inputs>
						<ui-input :value="report.user | acct" type="text" readonly>
							<span>{{ $t('target') }}</span>
						</ui-input>
						<ui-input :value="report.reporter | acct" type="text" readonly v-if="report.reporter">
							<span>{{ $t('reporter') }}</span>
						</ui-input>
						<ui-input :value="$t('anti-spam')" type="text" readonly v-else>
							<span>{{ $t('reporter') }}</span>
						</ui-input>
					</ui-horizon-group>
					<ui-textarea :value="report.comment" readonly>
						<span>{{ $t('details') }}</span>
					</ui-textarea>
					<ui-horizon-group inputs>
						<ui-button @click="execute('suspend', report)"><fa :icon="faSnowflake"/> {{ $t('suspend-user') }}</ui-button>
						<ui-button @click="execute('silence', report)"><fa :icon="faMicrophoneSlash"/> {{ $t('silence-user') }}</ui-button>
						<ui-button @click="removeReport(report)"><fa :icon="faTrashAlt"/> {{ $t('remove-report') }}</ui-button>
					</ui-horizon-group>
				</div>
			</sequential-entrance>
			<ui-button v-if="existMore" @click="fetchUserReports">{{ $t('@.load-more') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { faExclamationCircle, faSnowflake, faMicrophoneSlash, faTrashAlt } from '@fortawesome/pro-light-svg-icons';

interface IReport {
	id: string;
	comment: string;
	user: { id: string; };
	reporter: { id: string; };
}

export default Vue.extend({
	i18n: i18n('admin/views/abuse.vue'),

	data() {
		return {
			limit: 10,
			untilId: undefined,
			userReports: [],
			existMore: false,
			faExclamationCircle,
			faSnowflake,
			faMicrophoneSlash,
			faTrashAlt,
		};
	},

	mounted() {
		this.fetchUserReports();
	},

	methods: {
		fetchUserReports() {
			this.$root.api('admin/abuse-user-reports', {
				untilId: this.untilId,
				limit: this.limit + 1
			}).then(reports => {
				if (reports.length == this.limit + 1) {
					reports.pop();
					this.existMore = true;
				} else {
					this.existMore = false;
				}
				this.userReports = this.userReports.concat(reports);
				this.untilId = this.userReports[this.userReports.length - 1].id;
			});
		},

		removeReport(report: IReport) {
			this.$root.api('admin/remove-abuse-user-report', {
				reportId: report.id
			}).then(() => {
				this.userReports = this.userReports.filter(r => r.id != report.id);
			});
		},

		confirm(this: Record<'$root', {dialog(options: object): Promise<{ canceled: boolean }> }>, text?: string) {
			return this.$root.dialog({
				type: 'warning',
				showCancelButton: true,
				title: 'confirm',
				text,
			}).then(({ canceled }) => canceled ? Promise.resolve() : Promise.reject())
		},

		execute(action: string, report: IReport) {
			this.confirm(action)
				.then(() => this.$root.api(`admin/${action}-user`, { userId: report.user.id }))
				.then(() => this.removeReport(report))
				.then(() => this.$root.dialog({ type: 'success', splash: true }))
				.catch((e: Error) => this.$root.dialog({ type: 'error', text: e.toString() }))
		}
	}
});
</script>

<style lang="stylus" scoped>
.haexwsjc
	padding-bottom 16px
	border-bottom solid 1px var(--faceDivider)
</style>
