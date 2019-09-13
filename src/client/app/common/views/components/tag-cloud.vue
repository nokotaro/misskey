<template>
<div class="jtivnzhfwquxpsfidertopbmwmchmnmo">
	<p class="fetching" v-if="fetching"><fa :icon="['fal', 'spinner']" pulse fixed-width/>{{ $t('@.loading') }}<mk-ellipsis/></p>
	<p class="empty" v-else-if="!tags.length"><fa :icon="['fal', 'exclamation-circle']"/>{{ $t('empty') }}</p>
	<div v-else>
		<vue-word-cloud
				:words="words"
				:color="color"
				:spacing="1"
				@update:progress="updateProgress"
				font-family="kan412typos-std">
			<template slot-scope="{word, text, weight}">
				<router-link :to="`/tags/${text}`" style="cursor:pointer" :title="weight">{{ text }}</router-link>
			</template>
		</vue-word-cloud>
		<div class="progress" v-if="completed !== total">
			<div><fa :icon="['fal', 'spinner']" pulse fixed-width/>{{ $t('@.rendering') }}<mk-ellipsis/></div>
			<div><span>{{ pad }}</span><span>{{ completed }} / {{ total }}</span></div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import * as VueWordCloud from 'vuewordcloud';
import { lab } from 'color-convert';

declare class UpdateProgressEventArgs {
	public get completedWords();
	public set completedWords(value: number);
	public get totalWords();
	public set totalWords(value: number);
}

function numberLength(value: number) {
	const string = value.toString();

	return string.includes('e') ? -~string.substr(string.indexOf('e')) : string.length;
}

export default Vue.extend({
	i18n: i18n('common/views/components/tag-cloud.vue'),
	props: {
		limit: {
			type: Number,
			default: 25
		},
		range: {
			type: Number,
			default: 6048e5
		},
		count: {
			type: Number,
			default: 1e2
		}
	},
	components: {
		[VueWordCloud.name]: VueWordCloud
	},
	data() {
		return {
			completed: 0,
			total: 0,
			tags: [],
			fetching: true,
			clock: null
		};
	},
	created() {
		this.fetch();
		this.clock = setInterval(this.fetch, 65536);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	computed: {
		pad(this: {
			completed: number;
			total: number;
		}) {
			return '0'.repeat(numberLength(this.total) - numberLength(this.completed));
		},
		words(this: {
			count: number;
			tags: {
				name: string;
				count: number;
			}[];
		}) {
			return this.tags.slice(0, this.count).map(x => [x.name, x.count]);
		}
	},
	methods: {
		fetch() {
			this.$root.api('aggregation/hashtags', {
				limit: this.limit
				rangeMilliseconds: this.range
			}).then(tags => {
				this.tags = tags;
				this.fetching = false;
			});
		},
		updateProgress(this: {
			completed: number;
			total: number;
		}, value: UpdateProgressEventArgs) {
			this.completed = value.completedWords;
			this.total = value.totalWords;
		},
		color([, weight]: [string, number]): string {
			const peak = Math.max(...this.tags.map(x => x.count));
			const w = weight / peak;

			return `#${lab.hex([
				this.$store.state.device.darkmode ? 64 : 36,
				w * 128 - 64,
				w * 72 + Math.random() * 48 - 60
			])}`;
		}
	}
});
</script>

<style lang="stylus" scoped>
.jtivnzhfwquxpsfidertopbmwmchmnmo
	height 100%
	width 100%

	> .fetching
	> .empty
		margin 0
		padding 16px
		text-align center
		color var(--text)

		> [data-icon]
			margin-right 4px

	> div
		display grid
		grid-template 1fr/1fr
		height 100%
		width 100%

		> *
			grid-column 1/1
			grid-row 1/1

			a
				color inherit

			&.progress
				align-items center
				color var(--text)
				display flex
				flex-flow column wrap
				justify-content center

				> :first-child > [data-icon]
					margin-right 4px

				> :last-child
					-webkit-font-feature-settings 'tnum'
					-moz-font-feature-settings 'tnum'
					font-feature-settings 'tnum'
					font-variant-numeric tabular-nums

					> :first-child
						visibility hidden
</style>
