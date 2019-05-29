<template>
<main>
	<ui-card>
		<template #title>利用規約</template>
		<section>
			<header>
				<fa :icon="['fal', 'atlas']" fixed-width/>
				<span class="title">総則</span>
			</header>
			<div class="slot">
			</div>
		</section>
	</ui-card>
	<ui-card>
		<template #title>プライバシーポリシー</template>
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
});
</script>

<style lang="stylus" scoped>
main
	max-width 700px
	margin 0 auto

	.slot
		display flex
		gap 8px
		margin -32px 0

		> *
			flex 1 1 auto

	.title
		margin 8px
</style>
