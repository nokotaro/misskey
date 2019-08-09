<template>
<div class="age14b83" v-hotkey.global="keymap">
	<div class="backdrop" ref="backdrop" @click="close"></div>
	<div class="popover await" :class="{ 'prefer-sushi': $store.getters.isSignedIn && $store.state.settings.iLikeSushi }" ref="popover">
		<div class="emoji" :class="{ hidden: !enableEmojiReaction }" key="emoji">
			<div @click="pickEmoji"><fa :icon="['fal', 'icons']"/></div>
		</div>
		<div v-for="(x, i) in ['like', 'love', 'laugh', 'hmm', 'surprise']" :key="x" :class="x">
			<div @click="react(x)" :tabindex="-~i" :title="$t(`@.reactions.${x}`)" v-particle="x !== 'congrats'" v-particle:congrats="x === 'congrats'"></div>
		</div>
		<div class="recent" :class="{ hidden: !enableEmojiReaction }" key="recent">
			<div @click="react(recentReaction)" ref="recent"></div>
		</div>
		<div v-for="(x, i) in ['pudding', 'rip', 'confused', 'angry', 'congrats']" :key="x" :class="x">
			<div @click="react(x)" :tabindex="10-i" :title="$t(`@.reactions.${x}`)" v-particle="x !== 'congrats'" v-particle:congrats="x === 'congrats'"></div>
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
		},

		recentReaction() {
			return localStorage.getItem('recentReaction') || '';
		}
	},

	mounted() {
		this.$root.getMeta().then(meta => {
			this.enableEmojiReaction = meta.enableEmojiReaction;
			this.$nextTick(() => {
				if (!this.$root.isMobile && this.$refs.text) this.$refs.text.focus();
			});
		});

		const recentReaction = localStorage.getItem('recentReaction') || '';

		this.$nextTick(() => {

			let url = '';

			if (recentReaction.startsWith(':')) {
				url = `/assets/emojis/${recentReaction.substr(1, recentReaction.length - 2)}`;
			} else {
				const char = (() => {
					switch (recentReaction) {
						case 'like': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction0 ? this.$store.state.settings.reaction0 : '👍');
						case 'love': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction1 ? this.$store.state.settings.reaction1 : '❤');
						case 'laugh': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction2 ? this.$store.state.settings.reaction2 : '😆');
						case 'hmm': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction3 ? this.$store.state.settings.reaction3 : '🤔');
						case 'surprise': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction4 ? this.$store.state.settings.reaction4 : '😮');
						case 'congrats': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction5 ? this.$store.state.settings.reaction5 : '🎉');
						case 'angry': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction6 ? this.$store.state.settings.reaction6 : '💢');
						case 'confused': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction7 ? this.$store.state.settings.reaction7 : '😥');
						case 'rip': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction8 ? this.$store.state.settings.reaction8 : '😇');
						case 'pudding': return (
							this.$store.getters.isSignedIn && this.$store.state.settings.reaction9 ? this.$store.state.settings.reaction9 :
							this.$store.getters.isSignedIn && this.$store.state.settings.iLikeSushi ? '🍣' : '🍮');
						case 'twitter_favorite': return '❤';
						case 'star':
						case '': return '⭐';
						default: return recentReaction;
					}
				})();

				let codes = Array.from(char).map(x => x.codePointAt(0).toString(16));

				if (!codes.includes('200d')) {
					codes = codes.filter(x => x != 'fe0f');
				}

				codes = codes.filter(x => x && x.length);

				url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/${codes.join('-')}.svg`;
			}

			if (this.$refs.recent && this.$refs.recent.style) {
				this.$refs.recent.style = `--recent-reaction-url:url('${url.replace('\'', '%27')}')`;
			}

			this.$nextTick(() => {
				const popover: HTMLElement = this.$refs.popover;

				const { left, top } = this.source.getBoundingClientRect();

				popover.style.left = ((left + window.pageXOffset + (this.source.offsetWidth / 2)) - (popover.offsetWidth / 2)) + 'px';
				popover.style.top = ((top + window.pageYOffset + (this.source.offsetHeight / 2)) - (popover.offsetHeight / 2)) + 'px';

				popover.classList.remove('await');
			});
		})
	},

	methods: {
		react(reaction: string) {
			reaction = reaction || '⭐';

			if (![
				'👍', '❤', '😆', '🤔', '😮', '🎉', '💢', '😥', '😇', '🍣', '🍮', '⭐',
				'like', 'love', 'twitter_favorite', 'laugh', 'hmm', 'surprise',
				'congrats', 'angry', 'confused', 'rip', 'pudding', 'star', ''
			].includes(reaction)) {
				localStorage.setItem('recentReaction', reaction);
			}

			this.$emit('reacted', reaction);

			const { popover }: Record<string, HTMLElement> = (this as any).$refs;
			const elements: HTMLElement[] = [...popover.children as any];
			const filtered = elements.filter(({ classList }) => classList.contains(reaction));
			const [element] = filtered.length ? filtered : elements;

			if (element) {
				element.classList.add('active');
			}

			if (this.note) {
				this.$root.api('notes/reactions/create', {
					noteId: this.note.id,
					reaction
				}).then(() => {
					const popover: HTMLElement = this.$refs.popover;
					popover.classList.add('close');
					if (this.cb) this.cb();
					this.$emit('closed');
					setTimeout(this.destroyDom, 1000);
				}, (text: string) => {
					this.$root.dialog({
						type: 'error',
						text
					});
					popover.classList.add('close');
					if (this.cb) this.cb();
					this.$emit('closed');
					setTimeout(this.destroyDom, 1000);
				});
			} else {
				const popover: HTMLElement = this.$refs.popover;
				popover.classList.add('close');
				if (this.cb) this.cb();
				this.$emit('closed');
				setTimeout(this.destroyDom, 1000);
			}
		},

		pickEmoji() {
			const { left, top } = (this.$refs.popover as HTMLElement).style;
			const [x, y, z] = [...([left, top].map(x => parseInt(x.match(/(\d+)/)[1]))), 10002];
			const vm = this.$root.new(EmojiPicker, { x, y, z });
			vm.$once('chosen', this.react);
		},

		close() {
			const backdrop: HTMLElement = this.$refs.backdrop;
			backdrop.style.pointerEvents = 'none';
			anime({
				targets: backdrop,
				opacity: 0,
				duration: this.animation ? 200 : 0,
				easing: 'linear'
			});

			const popover: HTMLElement = this.$refs.popover;
			popover.classList.add('close');
			this.$emit('closed');
			setTimeout(this.destroyDom, 1000);
		},
	}
});
</script>

<style lang="stylus" scoped>
@css{.age14b83>.popover>div{-webkit-mask:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><path d="M96,0a96,96,0,1,0,96,96A96,96,0,0,0,96,0Zm0,152a56,56,0,1,1,56-56A56,56,0,0,1,96,152Z"/></svg>');mask:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><path d="M96,0a96,96,0,1,0,96,96A96,96,0,0,0,96,0Zm0,152a56,56,0,1,1,56-56A56,56,0,0,1,96,152Z"/></svg>')}}

@keyframes x
	0%
		transform rotate(0)
	to
		transform rotate(1turn)

@keyframes y
	0%
		transform scale(1)
	to
		transform scale(.001) // Avoid the Servo bug

.age14b83
	position initial

	> .backdrop
		background var(--modalBackdrop)
		height 100%
		left 0
		position fixed
		top 0
		width 100%
		z-index 10000

	> .popover
		// animation x 300s linear infinite
		display grid
		height 192px
		pointer-events none
		position absolute
		width 192px
		will-change transform
		z-index 10001

		&.await > div
			transform rotate(-90deg) scale(.001) // Avoid the Servo bug

		&.close > div
			transform rotate(90deg) scale(.001) // Avoid the Servo bug

			&.active
				animation y .25s cubic-bezier(.08,.82,.17,1) .75s both
				background-color var(--primary)

				> div::before
					background-color var(--primary)

			> div
				pointer-events none

		&.prefer-sushi > :nth-child(8) > div::before
			background-image var(--reaction-9-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f363.svg'))

		> div
			grid-column 1
			grid-row 1
			transition transform .25s cubic-bezier(.08,.82,.17,1)
			transform rotate(0) scale(1)
			will-change transform

			&.hidden
				display none

			&:nth-child(6n+1):not(.active) > div:not(:hover)::before
				background-color var(--infoBg)

			> div
				height 0
				left 72px
				pointer-events auto
				width 0

				&::before
					background var(--popupBg) 50% 12.5%/50% no-repeat
					content ''
					-webkit-clip-path polygon(0 0,100% 0,75% 48%,25% 48%)
					clip-path polygon(0 0,100% 0,75% 48%,25% 48%)
					cursor pointer
					display block
					height 96px
					transform-origin bottom
					width 48px

				&:hover::before
					background-color var(--primary)

				> svg
					color var(--text)
					height 24px
					top -12px
					width 24px

			&:nth-child(1)
				> div
					&::before
						transform rotate(-90deg)

					> svg
						left -64px
						transform rotate(-90deg)

			&:nth-child(2)
				transition-delay .01s

				> div::before
					background-image var(--reaction-0-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f44d.svg'))
					transform rotate(-60deg)

			&:nth-child(3)
				transition-delay .02s

				> div::before
					background-image var(--reaction-1-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/2764.svg'))
					transform rotate(-30deg)

			&:nth-child(4)
				transition-delay .03s

				> div::before
					background-image var(--reaction-2-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f606.svg'))

			&:nth-child(5)
				transition-delay .04s

				> div::before
					background-image var(--reaction-3-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f914.svg'))
					transform rotate(30deg)

			&:nth-child(6)
				transition-delay .05s

				> div::before
					background-image var(--reaction-4-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f62e.svg'))
					transform rotate(60deg)

			&:nth-child(7)
				transition-delay .06s

				> div
					&::before
						background-image var(--recent-reaction-url)
						transform rotate(90deg)

					> svg
						left 88px
						transform rotate(90deg)

			&:nth-child(8)
				transition-delay .07s

				> div::before
					background-image var(--reaction-9-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f36e.svg'))
					transform rotate(120deg)

			&:nth-child(9)
				transition-delay .08s

				> div::before
					background-image var(--reaction-8-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f607.svg'))
					transform rotate(150deg)

			&:nth-child(10)
				transition-delay .09s

				> div::before
					background-image var(--reaction-7-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f625.svg'))
					transform rotate(180deg)

			&:nth-child(11)
				transition-delay .1s

				> div::before
					background-image var(--reaction-6-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f4a2.svg'))
					transform rotate(-150deg)

			&:nth-child(12)
				transition-delay .11s

				> div::before
					background-image var(--reaction-5-url, url('https://cdnjs.cloudflare.com/ajax/libs/twemoji/12.0.1/2/svg/1f389.svg'))
					transform rotate(-120deg)
</style>
