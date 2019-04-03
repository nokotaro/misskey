<template>
<div class="mk-calendar" :data-melt="design == 4 || design == 5" :class="{ shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
	<template v-if="!design || !~-design">
		<button @click="prev" :title="$t('prev')"><fa icon="chevron-circle-left"/></button>
		<p class="title">{{ $t('title', { year, month }) }}</p>
		<button @click="next" :title="$t('next')"><fa icon="chevron-circle-right"/></button>
	</template>

	<div class="calendar">
		<template v-if="~design & 1">
		<div class="weekday"
			v-for="(day, i) in Array(7).fill(0)"
			:data-today="year == today.getFullYear() && month == today.getMonth() + 1 && today.getDay() == i"
			:data-is-saturday="!(i - 6)"
			:data-is-sunday="!i"
		>{{ weekdayText[i] }}</div>
		</template>
		<div v-for="n in paddingDays"></div>
		<div class="day" v-for="(day, i) in days"
			:data-today="isToday(i + 1)"
			:data-selected="isSelected(i + 1)"
			:data-is-out-of-range="isOutOfRange(i + 1)"
			:data-is-saturday="isSaturday(i + 1)"
			:data-is-sunday="isSunday(i + 1)"
			@click="go(i + 1)"
			:title="isOutOfRange(i + 1) ? null : $t('go')"
		>
			<div>{{ i + 1 }}</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

const eachMonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default Vue.extend({
	i18n: i18n('desktop/views/components/calendar.vue'),
	props: {
		design: {
			default: 0
		},
		start: {
			type: Date,
			required: false
		}
	},
	data() {
		const today = new Date();

		return {
			today,
			year: today.getFullYear(),
			month: today.getMonth() + 1,
			selected: today,
			weekdayText: [
				this.$t('@.weekday-short.sunday'),
				this.$t('@.weekday-short.monday'),
				this.$t('@.weekday-short.tuesday'),
				this.$t('@.weekday-short.wednesday'),
				this.$t('@.weekday-short.thursday'),
				this.$t('@.weekday-short.friday'),
				this.$t('@.weekday-short.saturday')
			]
		};
	},
	computed: {
		paddingDays(): number {
			return new Date(this.year, this.month - 1, 1).getDay();
		},
		days(): number {
			const days = eachMonthDays[this.month - 1];

			return days + ((this.month == 2 && !((y => y & (y % 25 ? 3 : 15))(this.year))) as any as number);
		}
	},
	methods: {
		isToday(day) {
			return this.year == this.today.getFullYear() && this.month == this.today.getMonth() + 1 && day == this.today.getDate();
		},

		isSelected(day) {
			return this.year == this.selected.getFullYear() && this.month == this.selected.getMonth() + 1 && day == this.selected.getDate();
		},

		isOutOfRange(day) {
			const test = (new Date(this.year, this.month - 1, day)).getTime();
			return test > this.today.getTime() || this.start && test < (this.start as any).getTime();
		},

		isSaturday(day) {
			return new Date(this.year, this.month - 1, day).getDay() == 6;
		},

		isSunday(day) {
			return !new Date(this.year, this.month - 1, day).getDay();
		},

		prev() {
			if (this.month == 1) {
				this.year = this.year - 1;
				this.month = 12;
			} else {
				this.month--;
			}
		},

		next() {
			if (this.month == 12) {
				this.year = this.year + 1;
				this.month = 1;
			} else {
				this.month++;
			}
		},

		go(day) {
			if (this.isOutOfRange(day)) return;
			const date = new Date(this.year, this.month - 1, day, 23, 59, 59, 999);
			this.selected = date;
			this.$emit('chosen', this.selected);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-calendar
	color var(--calendarDay)
	background var(--face)
	overflow hidden

	&.round
		border-radius 6px

	&.shadow
		box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

	&[data-melt]
		background transparent !important
		border none !important

	> .title
		z-index 1
		margin 0
		padding 0 16px
		text-align center
		line-height 42px
		font-size 0.9em
		font-weight 600
		color var(--faceHeaderText)
		background var(--faceHeader)
		box-shadow 0 var(--lineWidth) rgba(#000, 0.07)

		> [data-icon]
			margin-right 4px

	> button
		position absolute
		z-index 2
		top 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color var(--faceTextButton)

		&:hover
			color var(--faceTextButtonHover)

		&:active
			color var(--faceTextButtonActive)

		&:first-of-type
			left 0

		&:last-of-type
			right 0

	> .calendar
		display flex
		flex-wrap wrap
		padding 16px

		*
			user-select none

		> div
			width calc(100% * (1/7))
			text-align center
			line-height 32px
			font-size 14px

			&.weekday
				color var(--calendarWeek)

				&[data-is-saturday]
					color var(--calendarSaturday, var(--calendarSaturdayOrSunday))

				&[data-is-sunday]
					color var(--calendarSunday, var(--calendarSaturdayOrSunday))

				&[data-today]
					box-shadow 0 0 0 var(--lineWidth) var(--calendarWeek) inset
					border-radius 6px

					&[data-is-saturday]
						box-shadow 0 0 0 var(--lineWidth) var(--calendarSaturday, var(--calendarSaturdayOrSunday)) inset

					&[data-is-sunday]
						box-shadow 0 0 0 var(--lineWidth) var(--calendarSunday, var(--calendarSaturdayOrSunday)) inset

			&.day
				cursor pointer
				color var(--calendarDay)

				> div
					border-radius 6px

				&:hover > div
					background var(--faceClearButtonHover)

				&:active > div
					background var(--faceClearButtonActive)

				&[data-is-saturday]
					color var(--calendarSaturdayOrSunday)
					color var(--calendarSaturday)

				&[data-is-sunday]
					color var(--calendarSaturdayOrSunday)
					color var(--calendarSunday)

				&[data-is-out-of-range]
					cursor default
					opacity 0.5

				&[data-selected]
					font-weight 600

					> div
						background var(--faceClearButtonHover)

					&:active > div
						background var(--faceClearButtonActive)

				&[data-today]
					> div
						color var(--primaryForeground)
						background var(--primary)

					&:hover > div
						background var(--primaryLighten10)

					&:active > div
						background var(--primaryDarken10)

</style>
