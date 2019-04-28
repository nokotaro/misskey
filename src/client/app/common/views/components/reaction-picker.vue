<template>
<div class="rdfaahpb" v-hotkey.global="keymap">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover" :class="{ isMobile: $root.isMobile }" ref="popover">
		<p v-if="!$root.isMobile">{{ title }}</p>
		<div class="buttons" ref="buttons">
			<button @click="react('like')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="1" :title="$t('@.reactions.like')" v-particle><mk-reaction-icon reaction="like"/></button>
			<button @click="react('love')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="2" :title="$t('@.reactions.love')" v-particle><mk-reaction-icon reaction="love"/></button>
			<button @click="react('laugh')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="3" :title="$t('@.reactions.laugh')" v-particle><mk-reaction-icon reaction="laugh"/></button>
			<button @click="react('hmm')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="4" :title="$t('@.reactions.hmm')" v-particle><mk-reaction-icon reaction="hmm"/></button>
			<button @click="react('surprise')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="5" :title="$t('@.reactions.surprise')" v-particle><mk-reaction-icon reaction="surprise"/></button>
			<button @click="react('congrats')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="6" :title="$t('@.reactions.congrats')" v-particle><mk-reaction-icon reaction="congrats"/></button>
			<button @click="react('angry')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="7" :title="$t('@.reactions.angry')" v-particle><mk-reaction-icon reaction="angry"/></button>
			<button @click="react('confused')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="8" :title="$t('@.reactions.confused')" v-particle><mk-reaction-icon reaction="confused"/></button>
			<button @click="react('rip')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="9" :title="$t('@.reactions.rip')" v-particle><mk-reaction-icon reaction="rip"/></button>
			<button @click="react('pudding')" @mouseover="onMouseover" @mouseout="onMouseout" tabindex="10" :title="$t('@.reactions.pudding')" v-particle><mk-reaction-icon reaction="pudding"/></button>
		</div>
		<div v-if="enableEmojiReaction" ref="pickButton">
			<ui-button @click="pickEmoji">{{ $t('react-emoji') }}</ui-button>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import anime from 'animejs';
import EmojiPicker from '../../../desktop/views/components/emoji-picker-dialog.vue';

export default Vue.extend({
	i18n: i18n('common/views/components/reaction-picker.vue'),
	props: {
		note: {
			type: Object,
			required: false
		},

		source: {
			required: true
		},

		cb: {
			required: false
		},

		animation: {
			type: Boolean,
			required: false,
			default: true
		}
	},

	data() {
		return {
			title: this.$t('choose-reaction'),
			enableEmojiReaction: true,
		};
	},

	computed: {
		keymap(): any {
			return {
				'esc': this.close,
			};
		}
	},

	mounted() {
		this.$root.getMeta().then(meta => {
			this.enableEmojiReaction = meta.enableEmojiReaction;
			this.$nextTick(() => {
				if (this.$refs.text) this.$refs.text.focus();
			});
		});

		this.$nextTick(() => {
			const popover = this.$refs.popover as any;

			const rect = this.source.getBoundingClientRect();
			const width = popover.offsetWidth;
			const height = popover.offsetHeight;

			if (this.$root.isMobile) {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + (this.source.offsetHeight / 2);
				popover.style.left = (x - (width / 2)) + 'px';
				popover.style.top = (y - (height / 2)) + 'px';
			} else {
				const x = rect.left + window.pageXOffset + (this.source.offsetWidth / 2);
				const y = rect.top + window.pageYOffset + this.source.offsetHeight;
				popover.style.left = (x - (width / 2)) + 'px';
				popover.style.top = y + 'px';
			}

			anime({
				targets: this.$refs.backdrop,
				opacity: 1,
				duration: this.animation ? 100 : 0,
				easing: 'linear'
			});

			anime({
				targets: this.$refs.popover,
				opacity: 1,
				scale: [0.5, 1],
				duration: this.animation ? 500 : 0
			});
		});
	},

	methods: {
		react(reaction) {
			this.$emit('reacted', reaction);

			if (this.note) {
				this.$root.api('notes/reactions/create', {
					noteId: this.note.id,
					reaction
				}).then(() => {
					if (this.cb) this.cb();
					this.$emit('closed');
					this.destroyDom();
				});
			} else {
				if (this.cb) this.cb();
				this.$emit('closed');
				this.destroyDom();
			}
		},

		pickEmoji() {
			const { left, top } = (this.$refs.popover as HTMLElement).style;
			const [x, y, z] = [...([left, top].map(x => parseInt(x.match(/(\d+)/)[1]))), 10002];
			const vm = this.$root.new(EmojiPicker, { x, y, z });
			vm.$once('chosen', this.react);
		},

		onMouseover(e) {
			this.title = e.target.title;
		},

		onMouseout(e) {
			this.title = this.$t('choose-reaction');
		},

		close() {
			(this.$refs.backdrop as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.backdrop,
				opacity: 0,
				duration: this.animation ? 200 : 0,
				easing: 'linear'
			});

			(this.$refs.popover as any).style.pointerEvents = 'none';
			anime({
				targets: this.$refs.popover,
				opacity: 0,
				scale: 0.5,
				duration: this.animation ? 200 : 0,
				easing: 'easeInBack',
				complete: () => {
					this.$emit('closed');
					this.destroyDom();
				}
			});
		},
	}
});
</script>

<style lang="stylus" scoped>
.rdfaahpb
	position initial

	> .backdrop
		position fixed
		top 0
		left 0
		z-index 10000
		width 100%
		height 100%
		background var(--modalBackdrop)
		opacity 0

	> .popover
		$bgcolor = var(--popupBg)
		position absolute
		z-index 10001
		background $bgcolor
		border-radius 4px
		box-shadow 0 3px 12px rgba(27, 31, 35, 0.15)
		transform scale(0.5)
		opacity 0

		&.isMobile
			> div
				width 280px

				&.buttons
					> button
						width 50px
						height 50px
						font-size 28px
						border-radius 4px

		&:not(.isMobile)
			$arrow-size = 16px

			margin-top $arrow-size
			transform-origin center -($arrow-size)

			&:before
				content ""
				display block
				position absolute
				top -($arrow-size * 2)
				left s('calc(50% - %s)', $arrow-size)
				border-top solid $arrow-size transparent
				border-left solid $arrow-size transparent
				border-right solid $arrow-size transparent
				border-bottom solid $arrow-size $bgcolor

		> p
			display block
			margin 0
			padding 8px 10px
			font-size 14px
			color var(--popupFg)
			border-bottom solid var(--lineWidth) var(--faceDivider)
			text-align center

		> .buttons
			display grid
			grid repeat(2, 1fr) \/ repeat(5, 1fr)
			padding 4px 4px 8px
			text-align center

			> button
				padding 0
				min-width calc(5em / 3)
				min-height calc(5em / 3)
				font-size 24px
				border-radius 2px

				> *
					height 1em

				&:hover
					background var(--reactionPickerButtonHoverBg)

				&:active
					background var(--primary)
					box-shadow inset 0 0.15em 0.3em rgba(27, 31, 35, 0.15)
</style>
