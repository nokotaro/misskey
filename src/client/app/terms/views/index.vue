<template>
<main>
	<ui-card>
		<template #title><fa :icon="['fal', 'balance-scale']" fixed-width/>&nbsp;利用規約</template>
		<section>
			<div class="slot">
				<p>本利用規約（以下、「本規約」といいます。）は、{{ domain }} ドメイン上で展開される SNS および</p>
			</div>
		</section>
		<section>
			<header>
				<fa :icon="['fal', 'atlas']" fixed-width/>
				<span class="title">総則</span>
			</header>
			<div class="slot">
				<p></p>
			</div>
		</section>
	</ui-card>
	<ui-card>
		<template #title><fa :icon="['fal', 'user-secret']" fixed-width/>&nbsp;プライバシーポリシー</template>
		<section>
			<header>
				<fa :icon="['fal', 'atlas']" fixed-width/>
				<span class="title">総則</span>
			</header>
			<div class="slot">
			</div>
		</section>
	</ui-card>
</main>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			domain: 'twista.283.cloud'
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	max-width 700px
	margin 0 auto

	.slot
		display flex
		gap 8px

		> *
			flex 1 1 auto
			margin 0

	.title
		margin 8px
</style>
