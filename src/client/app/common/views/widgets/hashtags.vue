<template>
<div class="mkw-hashtags">
	<ui-container :show-header="!props.compact">
		<template #header><fa :icon="['fal', 'hashtag']"/>{{ $t('title') }}</template>
		<template #func><router-link to="/tags" tag="button"><fa :icon="['fal', 'globe-stand']"/></router-link></template>

		<div class="mkw-hashtags--body" :data-mobile="platform == 'mobile'">
			<mk-trends/>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import i18n from '../../../i18n';

export default define({
	name: 'hashtags',
	props: () => ({
		compact: false
	})
}).extend({
	i18n: i18n('common/views/widgets/hashtags.vue'),
	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		}
	}
});
</script>
