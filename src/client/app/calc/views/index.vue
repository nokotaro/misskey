<template>
<main>
	<ui-card>
		<template #title>Cost Calculator</template>
		<section>
			<header>
				<fa :icon="['fal', 'user-ninja']" fixed-width/>
				<span class="title">Produce</span>
			</header>
			<div class="slot">
				<ui-select v-model="produceIdolType" placeholder="Type">
					<option value="14">Gasha SSR</option>
					<option value="12">SSR</option>
					<option value="10">Gasha SR</option>
					<option value="8">SR</option>
					<option value="6">R/N</option>
				</ui-select>
				<ui-select v-model="produceIdolGrade" placeholder="Grade">
					<option value="4">★★★★</option>
					<option value="3">★★★☆</option>
					<option value="2">★★☆☆</option>
					<option value="1">★☆☆☆</option>
					<option value="0">☆☆☆☆</option>
				</ui-select>
			</div>
		</section>
		<section>
			<header>
				<fa :icon="['fal', 'user-friends']" fixed-width/>
				<span class="title">Support</span>
			</header>
			<div class="slot">
				<ui-select v-model="supportIdol1Type" placeholder="Type">
					<option value="14">Gasha SSR</option>
					<option value="12">SSR</option>
					<option value="10">Gasha SR</option>
					<option value="8">SR</option>
					<option value="6">R/N</option>
				</ui-select>
				<ui-select v-model="supportIdol1Grade" placeholder="Grade">
					<option value="4">★★★★</option>
					<option value="3">★★★☆</option>
					<option value="2">★★☆☆</option>
					<option value="1">★☆☆☆</option>
					<option value="0">☆☆☆☆</option>
				</ui-select>
				<ui-input v-model="supportIdol1Lv" type="number">Lv</ui-input>
			</div>
			<div class="slot">
				<ui-select v-model="supportIdol2Type" placeholder="Type">
					<option value="14">Gasha SSR</option>
					<option value="12">SSR</option>
					<option value="10">Gasha SR</option>
					<option value="8">SR</option>
					<option value="6">R/N</option>
				</ui-select>
				<ui-select v-model="supportIdol2Grade" placeholder="Grade">
					<option value="4">★★★★</option>
					<option value="3">★★★☆</option>
					<option value="2">★★☆☆</option>
					<option value="1">★☆☆☆</option>
					<option value="0">☆☆☆☆</option>
				</ui-select>
				<ui-input v-model="supportIdol2Lv" type="number">Lv</ui-input>
			</div>
			<div class="slot">
				<ui-select v-model="supportIdol3Type" placeholder="Type">
					<option value="14">Gasha SSR</option>
					<option value="12">SSR</option>
					<option value="10">Gasha SR</option>
					<option value="8">SR</option>
					<option value="6">R/N</option>
				</ui-select>
				<ui-select v-model="supportIdol3Grade" placeholder="Grade">
					<option value="4">★★★★</option>
					<option value="3">★★★☆</option>
					<option value="2">★★☆☆</option>
					<option value="1">★☆☆☆</option>
					<option value="0">☆☆☆☆</option>
				</ui-select>
				<ui-input v-model="supportIdol3Lv" type="number">Lv</ui-input>
			</div>
			<div class="slot">
				<ui-select v-model="supportIdol4Type" placeholder="Type">
					<option value="14">Gasha SSR</option>
					<option value="12">SSR</option>
					<option value="10">Gasha SR</option>
					<option value="8">SR</option>
					<option value="6">R/N</option>
				</ui-select>
				<ui-select v-model="supportIdol4Grade" placeholder="Grade">
					<option value="4">★★★★</option>
					<option value="3">★★★☆</option>
					<option value="2">★★☆☆</option>
					<option value="1">★☆☆☆</option>
					<option value="0">☆☆☆☆</option>
				</ui-select>
				<ui-input v-model="supportIdol4Lv" type="number">Lv</ui-input>
			</div>
		</section>
		<section>
			<header>
				<fa :icon="['fal', 'user-plus']" fixed-width/>
				<span class="title">Guest</span>
			</header>
			<div class="slot">
				<ui-select v-model="guestIdolType" placeholder="Type">
					<option value="14">Gasha SSR</option>
					<option value="12">SSR</option>
					<option value="10">Gasha SR</option>
					<option value="8">SR</option>
					<option value="6">R/N</option>
				</ui-select>
				<ui-select v-model="guestIdolGrade" placeholder="Grade">
					<option value="4">★★★★</option>
					<option value="3">★★★☆</option>
					<option value="2">★★☆☆</option>
					<option value="1">★☆☆☆</option>
					<option value="0">☆☆☆☆</option>
				</ui-select>
				<ui-input v-model="guestIdolLv" type="number">Lv</ui-input>
			</div>
		</section>
		<section>
			<header>
				<fa :icon="['fal', 'abacus']" fixed-width/>
				<span class="title">Cost</span>
			</header>
			<div class="slot">
				<ui-input :value="cost" readonly></ui-input>
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
			produceIdolType: '6',
			produceIdolGrade: '0',
			supportIdol1Type: '6',
			supportIdol1Grade: '0',
			supportIdol1Lv: '1',
			supportIdol2Type: '6',
			supportIdol2Grade: '0',
			supportIdol2Lv: '1',
			supportIdol3Type: '6',
			supportIdol3Grade: '0',
			supportIdol3Lv: '1',
			supportIdol4Type: '6',
			supportIdol4Grade: '0',
			supportIdol4Lv: '1',
			guestIdolType: '6',
			guestIdolGrade: '0',
			guestIdolLv: '1',
		};
	},

	computed: {
		cost() {
			const $ = x => parseInt(x) || 0;

			return ($(this.produceIdolType) + $(this.produceIdolGrade)) * ($(this.produceIdolType) - 4) +
				($(this.supportIdol1Type) + $(this.supportIdol1Grade)) * (~~($(this.supportIdol1Lv) / 10) + 1) +
				($(this.supportIdol2Type) + $(this.supportIdol2Grade)) * (~~($(this.supportIdol2Lv) / 10) + 1) +
				($(this.supportIdol3Type) + $(this.supportIdol3Grade)) * (~~($(this.supportIdol3Lv) / 10) + 1) +
				($(this.supportIdol4Type) + $(this.supportIdol4Grade)) * (~~($(this.supportIdol4Lv) / 10) + 1) +
				($(this.guestIdolType) + $(this.guestIdolGrade)) * (~~($(this.guestIdolLv) / 10) + 1);
		}
	},
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
