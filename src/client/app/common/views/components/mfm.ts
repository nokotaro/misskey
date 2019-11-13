import Vue, { VNode } from 'vue';
import { length } from 'stringz';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faAt } from '@fortawesome/pro-light-svg-icons';
import { MfmForest } from '../../../../../mfm/prelude';
import { parse, parsePlain, parseTruePlain } from '../../../../../mfm/parse';
import MkUrl from './url.vue';
import MkMention from './mention.vue';
import { concat, sum } from '../../../../../prelude/array';
import MkFormula from './formula.vue';
import MkCode from './code.vue';
import MkGoogle from './google.vue';
import { host } from '../../../config';
import { preorderF, countNodesF } from '../../../../../prelude/tree';
import * as config from '../../../config';
import { faNicoru } from '../../../icons/faNicoru';

function sumTextsLength(ts: MfmForest): number {
	const textNodes = preorderF(ts).filter(n => n.type === 'text');
	return sum(textNodes.map(x => length(x.props.text)));
}

export default Vue.component('mochimochi-fuwafuwa-markup', {
	props: {
		text: {
			type: String,
			required: true
		},
		plain: {
			type: Boolean,
			default: false
		},
		truePlain: {
			type: Boolean,
			default: false
		},
		nowrap: {
			type: Boolean,
			default: false
		},
		author: {
			type: Object,
			default: null
		},
		i: {
			type: Object,
			default: null
		},
		customEmojis: {
			required: false,
		},
		isNote: {
			type: Boolean,
			default: true
		},
	},

	render(createElement) {
		if (this.text == null || this.text == '') return;

		const ast = (this.plain ? this.truePlain ? parseTruePlain : parsePlain : parse)(this.text);

		let bigCount = 0;
		let motionCount = 0;

		const genEl = (ast: MfmForest) => concat(ast.map((token): VNode[] => {
			switch (token.node.type) {
				case 'text': {
					const text = token.node.props.text.replace(/(\r\n|\n|\r)/g, '\n');

					if (!this.plain) {
						const x = text.split('\n')
							.map(t => t == '' ? [createElement('br')] : [createElement('span', t), createElement('br')]);
						x[x.length - 1].pop();
						return x;
					} else {
						return [createElement('span', text.replace(/\n/g, ' '))];
					}
				}

				case 'bold': {
					return [createElement('b', genEl(token.children))];
				}

				case 'strike': {
					return [createElement('del', genEl(token.children))];
				}

				case 'serif': {
					return (createElement as any)('span', {
						attrs: {
							class: 'serif',
							style: 'font-family:vdl-v7mincho,serif'
						},
					}, genEl(token.children));
				}

				case 'italic': {
					return (createElement as any)('i', {
						attrs: {
							style: 'font-style:oblique'
						},
					}, genEl(token.children));
				}

				case 'big': {
					bigCount++;
					const isLong = sumTextsLength(token.children) > 100 || countNodesF(token.children) > 20;
					const isMany = bigCount > 50;
					return (createElement as any)('strong', {
						attrs: {
							style: `display:inline-block;font-size:${isMany ? '100%' : '150%'}`
						},
						directives: [this.$store.state.settings.disableAnimatedMfm || isLong || isMany ? {} : {
							name: 'animate-css',
							value: { classes: 'tada', iteration: 'infinite' }
						}]
					}, genEl(token.children));
				}

				case 'small': {
					return [createElement('small', {
						attrs: {
							style: 'font-size:calc(.75em + var(--fontSize)*.75);opacity:.7'
						},
					}, genEl(token.children))];
				}

				case 'center': {
					return [createElement('div', {
						attrs: {
							style: 'text-align:center'
						}
					}, genEl(token.children))];
				}

				case 'motion': {
					motionCount++;
					const isLong = sumTextsLength(token.children) > 100 || countNodesF(token.children) > 20;
					const isMany = motionCount > 50;
					return (createElement as any)('span', {
						attrs: {
							style: 'display:inline-block'
						},
						directives: [this.$store.state.settings.disableAnimatedMfm || isLong || isMany ? {} : {
							name: 'animate-css',
							value: { classes: 'rubberBand', iteration: 'infinite' }
						}]
					}, genEl(token.children));
				}

				case 'opentype': {
					const settings = `font-feature-settings:${(token.node.props.attr as string).split(' ').map(x => {
						const [tag, value] = x.split('-');
						return `"${tag}"${value || ''}`;
					}).join()}`;
					return (createElement as any)('span', {
						attrs: {
							style: `-webkit-${settings};-moz-${settings};${settings}`
						},
					}, genEl(token.children));
				}

				case 'rt': {
					return [createElement('ruby', [
						createElement('rb', genEl(token.children)),
						createElement('rp', '《'),
						createElement('rt', token.node.props.rt),
						createElement('rp', '》')
					])];
				}

				case 'rtc': {
					return [createElement('ruby', [
						createElement('rbc', genEl(token.children)),
						createElement('rp', '〈'),
						createElement('rtc', token.node.props.rtc),
						createElement('rp', '〉')
					])];
				}

				case 'spin': {
					motionCount++;
					const isLong = sumTextsLength(token.children) > 100 || countNodesF(token.children) > 20;
					const isMany = motionCount > 50;
					const direction =
						token.node.props.attr == 'left' ? 'reverse' :
						token.node.props.attr == 'alternate' ? 'alternate' :
						'normal';
					const style = (this.$store.state.settings.disableAnimatedMfm || isLong || isMany) ?
						null :
						`animation:spin 1.5s linear infinite;animation-direction:${direction}`;
					return (createElement as any)('span', {
						attrs: {
							style: ['display:inline-block', style].filter(x => x).join(';')
						},
					}, genEl(token.children));
				}

				case 'xspin': {
					motionCount++;
					const isLong = sumTextsLength(token.children) > 100 || countNodesF(token.children) > 20;
					const isMany = motionCount > 50;
					return (createElement as any)('span', {
						attrs: {
							style: (this.$store.state.settings.disableAnimatedMfm || isLong || isMany) ?
								'display:inline-block' :
								`display:inline-block;animation:xspin 1.5s linear infinite`
						},
					}, genEl(token.children));
				}

				case 'yspin': {
					motionCount++;
					const isLong = sumTextsLength(token.children) > 100 || countNodesF(token.children) > 20;
					const isMany = motionCount > 50;
					return (createElement as any)('span', {
						attrs: {
							style: (this.$store.state.settings.disableAnimatedMfm || isLong || isMany) ?
								'display:inline-block' :
								`display:inline-block;animation:yspin 1.5s linear infinite`
						},
					}, genEl(token.children));
				}

				case 'jump': {
					motionCount++;
					const isLong = sumTextsLength(token.children) > 100 || countNodesF(token.children) > 20;
					const isMany = motionCount > 50;
					return (createElement as any)('span', {
						attrs: {
							style: (this.$store.state.settings.disableAnimatedMfm || isLong || isMany) ?
								'display:inline-block' :
								'display:inline-block;animation:jump .75s linear infinite'
						},
					}, genEl(token.children));
				}

				case 'flip': {
					return (createElement as any)('span', {
						attrs: {
							style: 'display:inline-block;transform:scaleX(-1)'
						},
					}, genEl(token.children));
				}

				case 'vflip': {
					return (createElement as any)('span', {
						attrs: {
							style: 'display:inline-block;transform:scaleY(-1)'
						},
					}, genEl(token.children));
				}

				case 'rotate': {
					const isLong = sumTextsLength(token.children) > 100 || countNodesF(token.children) > 20;
					const deg = token.node.props.attr;

					return (createElement as any)('span', {
						attrs: {
							style: isLong ? '' : `display:inline-block;transform:rotate(${deg}deg)`
						},
					}, genEl(token.children));
				}

				case 'url': {
					return [createElement(MkUrl, {
						key: Math.random(),
						props: {
							url: token.node.props.url,
							rel: 'nofollow noopener',
							target: '_blank',
							trim: true
						},
						attrs: {
							style: 'color:var(--mfmUrl)'
						}
					})];
				}

				case 'link': {
					return [createElement('a', {
						attrs: {
							class: 'link',
							href: token.node.props.url,
							rel: 'nofollow noopener',
							target: '_blank',
							title: token.node.props.url,
							style: 'color:var(--mfmLink)'
						}
					}, token.node.props.nico ? [
						createElement(FontAwesomeIcon, {
							key: Math.random(),
							props: {
								icon: faNicoru,
								fixedWidth: true
							}
						}),
						...genEl(token.children)
					] : genEl(token.children))];
				}

				case 'mention': {
					return [createElement(MkMention, {
						key: Math.random(),
						props: {
							customEmojis: this.customEmojis,
							host: (token.node.props.host == null && this.author && this.author.host != null ? this.author.host : token.node.props.host) || host,
							username: token.node.props.username
						}
					})];
				}

				case 'hashtag': {
					return [createElement('router-link', {
						key: Math.random(),
						attrs: {
							to: this.isNote ? `/tags/${encodeURIComponent(token.node.props.hashtag)}` : `/explore/tags/${encodeURIComponent(token.node.props.hashtag)}`,
							style: 'color:var(--mfmHashtag)'
						}
					}, `#${token.node.props.hashtag}`)];
				}

				case 'codeBlock': {
					return [createElement(MkCode, {
						key: Math.random(),
						props: {
							code: token.node.props.code,
							lang: token.node.props.lang,
						}
					})];
				}

				case 'codeInline': {
					return [createElement(MkCode, {
						key: Math.random(),
						props: {
							code: token.node.props.code,
							lang: token.node.props.lang,
							inline: true
						}
					})];
				}

				case 'bubble': {
					return [createElement('div', {
						attrs: {
							class: 'bubble'
						}
					}, [
						createElement('div', genEl(token.node.props.speaker)),
						createElement('div', genEl(token.children))
					])];
				}

				case 'quote': {
					if (this.shouldBreak) {
						return [createElement('div', {
							attrs: {
								class: 'quote'
							}
						}, genEl(token.children))];
					} else {
						return [createElement('span', {
							attrs: {
								class: 'quote'
							}
						}, genEl(token.children))];
					}
				}

				case 'title': {
					return [createElement('div', {
						attrs: {
							class: 'title'
						}
					}, genEl(token.children))];
				}

				case 'titlePlain': {
					return [createElement('span', {
						attrs: {
							class: 'title-plain',
							style: [
								...(token.node.props.background ? [`background:#${token.node.props.background}`] : []),
								...(token.node.props.foreground ? [`color:#${token.node.props.foreground}`] : []),
							].join(';')
						}
					}, genEl(token.children))];
				}

				case 'atPlain': {
					return [createElement('span', {
						attrs: {
							class: 'at-plain'
						}
					}, [
						createElement(FontAwesomeIcon, {
							key: Math.random(),
							props: {
								icon: faAt
							}
						}),
						createElement('span', {}, genEl(token.children))
					])];
				}

				case 'emoji': {
					const customEmojis = (this.$root.getMetaSync() || { emojis: [] }).emojis || [];
					return [createElement('mk-emoji', {
						key: Math.random(),
						attrs: {
							emoji: token.node.props.emoji,
							name: token.node.props.name,
							animate: !this.$store.state.device.disableShowingAnimatedImages,
							config
						},
						props: {
							customEmojis: this.customEmojis || customEmojis,
							normal: this.plain
						}
					})];
				}

				case 'mathInline': {
					//const MkFormula = () => import('./formula.vue').then(m => m.default);
					return [createElement(MkFormula, {
						key: Math.random(),
						props: {
							formula: token.node.props.formula,
							block: false
						}
					})];
				}

				case 'mathBlock': {
					//const MkFormula = () => import('./formula.vue').then(m => m.default);
					return [createElement(MkFormula, {
						key: Math.random(),
						props: {
							formula: token.node.props.formula,
							block: true
						}
					})];
				}

				case 'search': {
					//const MkGoogle = () => import('./google.vue').then(m => m.default);
					return [createElement(MkGoogle, {
						key: Math.random(),
						props: {
							q: token.node.props.query
						}
					})];
				}

				default: {
					console.log('unknown ast type:', token.node.type);

					return [];
				}
			}
		}));

		// Parse ast to DOM
		return createElement('span', genEl(ast));
	}
});
