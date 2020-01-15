import * as P from 'parsimmon';
import { createLeaf, createTree, urlRegex } from './prelude';
import { takeWhile, cumulativeSum } from '../prelude/array';
import parseAcct from '../misc/acct/parse';
import { toUnicode } from 'punycode';
import emojiRegex from '../misc/emoji-regex';
import normalize from './normalize';

export function removeOrphanedBrackets(s: string): string {
	const openBrackets = ['(', '「', '['];
	const closeBrackets = [')', '」', ']'];
	const xs = cumulativeSum(s.split('').map(c => {
		if (openBrackets.includes(c)) return 1;
		if (closeBrackets.includes(c)) return -1;
		return 0;
	}));
	const firstOrphanedCloseBracket = xs.findIndex(x => x < 0);
	if (firstOrphanedCloseBracket !== -1) return s.substr(0, firstOrphanedCloseBracket);
	const lastMatched = xs.lastIndexOf(0);
	return s.substr(0, lastMatched + 1);
}

export const mfmLanguage = P.createLanguage({
	root: r => P.alt(r.block, r.inline).atLeast(1),
	plain: r => P.alt(r.emoji, r.titlePlain, r.atPlain, r.text).atLeast(1),
	truePlain: r => P.alt(r.emoji, r.text).atLeast(1),
	block: r => P.alt(
		r.title,
		r.quote,
		/*
		r.list,
		*/
		r.bubble,
		r.search,
		r.codeBlock,
		r.mathBlock,
		r.center,
	),
	startOfLine: () => P((input, i) => {
		if (i == 0 || input[i] == '\n' || input[i - 1] == '\n') {
			return P.makeSuccess(i, null);
		} else {
			return P.makeFailure(i, 'not newline');
		}
	}),
	title: r => r.startOfLine.then(P((input, i) => {
		const text = input.substr(i);
		const match = text.match(/^(\[([^\[\]\n]+?)\])(\n|$)/) || text.match(/^(【([^【】\n]+?)】)(\n|$)/);
		if (!match) return P.makeFailure(i, 'not a title');
		const raw = match[0].trim();
		const q = match[2].trim();
		const contents = r.inline.atLeast(1).tryParse(q);
		return P.makeSuccess(i + match[0].length, createTree('title', contents, { raw }));
	})),
	/*
	titleInline: r => r.startOfLine.then(P((input, i) => {
		const text = input.substr(i);
		const match = text.match(/^(\[([^\[\]\n]+?)\])(?!\n|$)/) || text.match(/^(【([^【】\n]+?)】)(?!\n|$)/);
		if (!match) return P.makeFailure(i, 'not a inline title');
		const raw = match[0].trim();
		const q = match[2].trim();
		const contents = r.inline.atLeast(1).tryParse(q);
		return P.makeSuccess(i + match[0].length, createTree('titleInline', contents, { raw }));
	})),
	*/
	titlePlain: r => r.startOfLine.then(P((input, i) => {
		const text = input.substr(i);
		const match =
			text.match(/^(\[)(?:#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}(?![0-9A-Fa-f]{2})|[0-9A-Fa-f]{4}(?![0-9A-Fa-f]{2})|[0-9A-Fa-f]{3}(?![0-9A-Fa-f])))?(?:#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}(?![0-9A-Fa-f]{2})|[0-9A-Fa-f]{4}(?![0-9A-Fa-f]{2})|[0-9A-Fa-f]{3}(?![0-9A-Fa-f])))?([^\[\]\n]+?)(\])/) ||
			text.match(/^(【)(?:#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}(?![0-9A-Fa-f]{2})|[0-9A-Fa-f]{4}(?![0-9A-Fa-f]{2})|[0-9A-Fa-f]{3}(?![0-9A-Fa-f])))?(?:#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}(?![0-9A-Fa-f]{2})|[0-9A-Fa-f]{4}(?![0-9A-Fa-f]{2})|[0-9A-Fa-f]{3}(?![0-9A-Fa-f])))?([^【】\n]+?)(】)/);
		if (!match) return P.makeFailure(i, 'not a plain title');
		const background = match[2];
		const foreground = match[3];
		const q = match[4].trim();
		const contents = r.plain.tryParse(q);
		const remote = normalize(contents, true);
		const raw = match[1].trim() + remote.map(x => x.node.props.text).join('') + match[5].trim();
		return P.makeSuccess(i + match[0].length, createTree('titlePlain', contents, { raw, background, foreground }));
	})),
	atPlain: r => P.regexp(/^@([^@]+?)$/, 1).map(x => createTree('atPlain', r.truePlain.tryParse(x.trim()), { raw: `@${x}` })),
	quote: r => r.startOfLine.then(P((input, i) => {
		const text = input.substr(i);
		if (!text.match(/^>[\s\S]+?/)) return P.makeFailure(i, 'not a quote');
		const quote = takeWhile(line => line.startsWith('>'), text.split('\n'));
		const qInner = quote.join('\n').replace(/^>/gm, '').replace(/^ /gm, '');
		if (qInner == '') return P.makeFailure(i, 'not a quote');
		const contents = r.root.tryParse(qInner);
		return P.makeSuccess(i + quote.join('\n').length + 1, createTree('quote', contents, {}));
	})),
	/*
	list: r => r.startOfLine.then(P((input, i) => {
		const text = input.substr(i);
		const [raw] = text.match(/^\* +.+(?:\n *\* +.+)*(REMOVE THIS)/m) || [null];
		if (!raw) return P.makeFailure(i, 'not a list');
		const split = raw.split('\n').map(x => x.split('*', 2) as [string, string]);
		if (split.some(x => ~-~-x.length as any as boolean)) return P.makeFailure(i, 'not a list');
		const lists = split.map(([l, c]) => ({
			content: r.inline.atLeast(1).tryParse(c.trim()),
			depth: l.length
		}));
		const euclidean: (m: number, n: number) => number = (m, n) => n ? euclidean(n, m % n) : m;
		const minmax = <T extends (x: number, y: number) => number>(a: number, b: number, c: T) => a > b ? c(a, b) : c(b, a);
		const gcd = lists.reduce((a, { depth }) => ~-a ? minmax(a, depth, euclidean) : a, 0) || 1;
		const gcded = lists.map(({ content, depth }) => (depth /= gcd, { content, depth }));
		if (gcded.reduce(({ accumulator, previous }, { depth }) => ({
			accumulator: accumulator || -~previous >= depth,
			previous: depth
		}), { accumulator: false, previous: 0 }).accumulator) return P.makeFailure(i, 'not a list');
		type Dove = {
			children: Dove[];
			content: any[];
			depth: number;
		};
		type Reducer = {
			cache: Dove;
			children: Dove[];
			list: Dove[];
			pointer: Dove[];
			stack: Dove[][];
		};
		const $ = (..._: any[]) => {}; // For unused expressions.
		const { children } = gcded.reduce<Reducer>(({ cache, children, list, pointer, stack }, { depth, content }) => (
			cache = { children, content, depth },
			-~stack.length !== depth ?
				stack.length !== depth ?
					$([...Array(stack.length - depth)]
						.map(_ =>
							$(children = stack.pop(),
								pointer = stack[~-stack.length],
								pointer[~-pointer.length].children = children))) :
					$(stack.push([cache])) :
				$(stack[depth].push(cache)),
			children = [],
			{ cache, children, list, pointer, stack }), {
				cache: null,
				children: [],
				list: [],
				pointer: [],
				stack: []
			});
		const [list] = children;
		return P.makeSuccess(i + raw.length, createLeaf('list', { list, raw }));
	})),
	*/
	bubble: r => r.startOfLine.then(P((input, i) => {
		try {
			const text = input.substr(i);
			const match = [
				['\'', '\''],
				['"', '"'],
				['‘', '’'],
				['“', '”'],
				['‚', '‘'],
				['„', '“'],
				['‚', '’'],
				['„', '”'],
				['‹', '›'],
				['«', '»'],
				['›', '‹'],
				['»', '«'],
				['｢', '｣'],
				['「', '」'],
				['『', '』'],
				['“', '”'],
				['‘', '’'],
				['〝', '〟'],
				['〝', '〞'],
				['“', '„']
			].map(([s, e]) => [
				[new RegExp(`^((?::\\w+:)+[^:\\n]*(?::\\w+:)*|(?::\\w+:)*[^:\\n]+(?::\\w+:)*|(?::\\w+:)*[^:\\n]*(?::\\w+:)+): ${s}(.+?)${e}(?:\\n|$)`)],
				...['：', '―', '—'].map(x => [
					new RegExp(`^([^${s}${e}\\n]+)${s}(.+?)${e}(?:\\n|$)`),
					new RegExp(`^([^${x}\\n]+)${x}${s}(.+?)${e}(?:\\n|$)`)
				])
			]).reduce((a, c) => [...a, ...c], [])
				.reduce((a, c) => [...a, ...c], [])
				.reduce<RegExpMatchArray>((a, c) => a || text.match(c), null);
			if (!match) return P.makeFailure(i, 'not a bubble');
			const raw = match[0].trim();
			const speaker = r.inline.atLeast(1).tryParse(match[1].trim());
			const contents = r.inline.atLeast(1).tryParse(match[2].trim());
			return P.makeSuccess(i + match[0].length, createTree('bubble', contents, { speaker, raw }));
		} catch (e) {
			return P.makeFailure(i, e);
		}
	})),
	search: r => r.startOfLine.then(P((input, i) => {
		const text = input.substr(i);
		const match = text.match(/^(.+?)( |　)(検索|\[検索\]|Search|\[Search\])(\n|$)/i);
		if (!match) return P.makeFailure(i, 'not a search');
		return P.makeSuccess(i + match[0].length, createLeaf('search', { query: match[1], content: match[0].trim() }));
	})),
	codeBlock: r => r.startOfLine.then(P((input, i) => {
		const text = input.substr(i);
		const match = text.match(/^```(.+?)?\n([\s\S]+?)\n```(\n|$)/i);
		if (!match) return P.makeFailure(i, 'not a codeBlock');
		return P.makeSuccess(i + match[0].length, createLeaf('codeBlock', { code: match[2], lang: match[1] ? match[1].trim() : null }));
	})),
	inline: r => P.alt(
		/*
		r.titleInline,
		*/
		r.big,
		r.bold,
		r.small,
		r.italic,
		r.serif,
		r.strike,
		r.opentype,
		r.rt,
		r.rtc,
		r.motion,
		r.spin,
		r.xspin,
		r.yspin,
		r.jump,
		r.flip,
		r.vflip,
		r.rotate,
		r.codeInline,
		r.mathInline,
		r.mention,
		r.hashtag,
		r.url,
		r.link,
		r.emoji,
		r.text
	),
	big: r => {
		const xml = P.regexp(/^<big>([\s\S]+?)<\/big>/, 1);
		const asterisk = P.regexp(/^\*\*\*([\s\S]+?)\*\*\*/, 1);
		return P.alt(xml, asterisk).map(x => createTree('big', r.inline.atLeast(1).tryParse(x), {}));
	},
	bold: r => {
		const xml = P.regexp(/<b>([\s\S]+?)<\/b>/, 1);
		const asterisk = P.regexp(/\*\*([\s\S]+?)\*\*/, 1);
		const underscore = P.regexp(/__([\s\S]+?)__/, 1);
		return P.alt(xml, asterisk, underscore).map(x => createTree('bold', r.inline.atLeast(1).tryParse(x), {}));
	},
	small: r => {
		const xml = P.regexp(/<small>([\s\S]+?)<\/small>/, 1);
		const underscore = P.regexp(/___([\s\S]+?)___/, 1);
		return P.alt(xml, underscore).map(x => createTree('small', r.inline.atLeast(1).tryParse(x), {}));
	},
	italic: r => {
		const xml = P.regexp(/<i>([\s\S]+?)<\/i>/, 1);
		const underscore = P((input, i) => {
			const text = input.substr(i);
			const match = text.match(/^(\*|_)([\s\S]+?)\1/);
			if (!match) return P.makeFailure(i, 'not a italic');
			if (input[i - 1] != null && input[i - 1] != ' ' && input[i - 1] != '\n') return P.makeFailure(i, 'not a italic');
			return P.makeSuccess(i + match[0].length, match[2]);
		});

		return P.alt(xml, underscore).map(x => createTree('italic', r.inline.atLeast(1).tryParse(x), {}));
	},
	serif: r => {
		const xml = P.regexp(/<m>([\s\S]+?)<\/m>/, 1);
		const backslash = P.regexp(/\\([^([][\s\S]*?)\\(?![\)\]])/, 1);
		return P.alt(xml, backslash).map(x => createTree('serif', r.inline.atLeast(1).tryParse(x), {}));
	},
	strike: r => {
		const xml = P.regexp(/<s>([\s\S]+?)<\/s>/, 1);
		const tilde = P.regexp(/~~([^\n~]+?)~~/, 1);
		return P.alt(xml, tilde).map(x => createTree('strike', r.inline.atLeast(1).tryParse(x), {}));
	},
	opentype: r => {
		return P((input, i) => {
			const text = input.substr(i);
			const match = text.match(/^<(opentype|ot?)((?:\s(?:liga|[csphn]alt|dlig|smcp|c2sc|swsh|[lopt]num|frac|ordn|ss(?:0[1-9]|1\d|20)|[pfhtq]wid|[phv]kna|jp(?:78|83|90|04)|trad|ruby|nlck|ital|vkrn|vert|v[ph]al|kern|ccmp|locl|su[pb]s)(?:-(?:\d+|on|off))?)+)>(.+?)<\/\1>/i);
			if (!match) return P.makeFailure(i, 'not an opentype');
			return P.makeSuccess(i + match[0].length, {
				content: match[3], attr: match[2] ? match[2].split(' ').filter(x => x.length).join(' ') : null
			});
		}).map(x => createTree('opentype', r.inline.atLeast(1).tryParse(x.content), { attr: x.attr }));
	},
	rt: r => P((input, i) => {
		const text = input.substr(i);
		const match = text.match(/^[|｜]([^|｜《》〈〉]+)《(.+?)》/);
		if (!match) return P.makeFailure(i, 'not a rt');
		const [raw, content, rt] = match;
		return P.makeSuccess(i + raw.length, { content, rt, raw });
	}).map(({ content, rt, raw }) => createTree('rt', r.inline.atLeast(1).tryParse(content), { rt, raw })),
	rtc: r => P((input, i) => {
		const text = input.substr(i);
		const match = text.match(/^[|｜]([^〈〉]+)〈(.+?)〉/);
		if (!match) return P.makeFailure(i, 'not a rtc');
		const [raw, content, rtc] = match;
		return P.makeSuccess(i + raw.length, { content, rtc, raw });
	}).map(({ content, rtc, raw }) => createTree('rtc', r.inline.atLeast(1).tryParse(content), { rtc, raw })),
	motion: r => {
		const xml = P.regexp(/<(m(?:otion)?)>(.+?)<\/\1>/, 2);
		const paren = P.regexp(/\(\(\(([\s\S]+?)\)\)\)/, 1);
		return P.alt(xml, paren).map(x => createTree('motion', r.inline.atLeast(1).tryParse(x), {}));
	},
	spin: r => {
		return P((input, i) => {
			const text = input.substr(i);
			const match = text.match(/^<spin(\s[a-z]+?)?>(.+?)<\/spin>/i);
			const matchC = text.match(/^\[\[\[([\s\S]+?)\]\]\]/i);

			if (match) {
				return P.makeSuccess(i + match[0].length, {
					content: match[2], attr: match[1] ? match[1].trim() : null
				});
			} else if (matchC) {
				return P.makeSuccess(i + matchC[0].length, {
					content: matchC[1], attr: null
				});
			} else {
				return P.makeFailure(i, 'not a spin');
			}
		}).map(x => createTree('spin', r.inline.atLeast(1).tryParse(x.content), { attr: x.attr }));
	},
	xspin: r => P.regexp(/<(x(?:spin))>(.+?)<\/\1>/, 2).map(x => createTree('xspin', r.inline.atLeast(1).tryParse(x), {})),
	yspin: r => P.regexp(/<(y(?:spin))>(.+?)<\/\1>/, 2).map(x => createTree('yspin', r.inline.atLeast(1).tryParse(x), {})),
	jump: r => P.alt(P.regexp(/<(j(?:ump)?)>(.+?)<\/\1>/, 2), P.regexp(/\{{3}([\s\S]+?)\}{3}/, 1)).map(x => createTree('jump', r.inline.atLeast(1).tryParse(x), {})),
	flip: r => P.alt(P.regexp(/<(f(?:lip)?)>(.+?)<\/\1>/, 2), P.regexp(/＜＜＜(.+?)＞＞＞/, 1)).map(x => createTree('flip', r.inline.atLeast(1).tryParse(x), {})),
	vflip: r => P.regexp(/<(v(?:flip))>(.+?)<\/\1>/, 2).map(x => createTree('vflip', r.inline.atLeast(1).tryParse(x), {})),
	rotate: r => {
		return P((input, i) => {
			const text = input.substr(i);
			const match = text.match(/^<(r(?:otate))\s+([+-]?\d+(?:\.\d+)?)>(.+?)<\/\1>/i);

			return match ?
				P.makeSuccess(i + match[0].length, {
					content: match[3],
					attr: match[2]
				}) :
				P.makeFailure(i, 'not a rotate');
		}).map(x => createTree('rotate', r.inline.atLeast(1).tryParse(x.content), { attr: x.attr }));
	},
	center: r => r.startOfLine.then(P.regexp(/<(c(?:enter)?)>([\s\S]+?)<\/\1>/, 2).map(x => createTree('center', r.inline.atLeast(1).tryParse(x), {}))),
	codeInline: () => P.regexp(/`([^´\n]+?)`/, 1).map(x => createLeaf('codeInline', { code: x })),
	mathBlock: r => r.startOfLine.then(P.regexp(/\\\[([\s\S]+?)\\\]/, 1).map(x => createLeaf('mathBlock', { formula: x.trim() }))),
	mathInline: () => P.regexp(/\\\((.+?)\\\)/, 1).map(x => createLeaf('mathInline', { formula: x })),
	mention: () => {
		return P((input, i) => {
			const text = input.substr(i);
			const match = text.match(/^@\w([\w-]*\w)?(?:@[\w\.\-]+\w)?/);
			if (!match) return P.makeFailure(i, 'not a mention');
			if (input[i - 1] != null && input[i - 1].match(/[a-z0-9]/i)) return P.makeFailure(i, 'not a mention');
			return P.makeSuccess(i + match[0].length, match[0]);
		}).map(x => {
			const { username, host } = parseAcct(x.substr(1));
			const canonical = host != null ? `@${username}@${toUnicode(host)}` : x;
			return createLeaf('mention', { canonical, username, host, acct: x });
		});
	},
	hashtag: () => P((input, i) => {
		const text = input.substr(i);
		const match = text.match(/^#([^\s\.,!\?'"#:\/\[\]]+)/i);
		if (!match) return P.makeFailure(i, 'not a hashtag');
		let hashtag = match[1];
		hashtag = removeOrphanedBrackets(hashtag);
		if (hashtag.match(/^[0-9]+$/)) return P.makeFailure(i, 'not a hashtag');
		if (input[i - 1] != null && input[i - 1].match(/[a-z0-9]/i)) return P.makeFailure(i, 'not a hashtag');
		if (hashtag.length > 50) return P.makeFailure(i, 'not a hashtag');
		return P.makeSuccess(i + ('#' + hashtag).length, createLeaf('hashtag', { hashtag: hashtag }));
	}),
	url: () => {
		return P((input, i) => {
			const text = input.substr(i);
			const match = text.match(urlRegex);
			let url: string;
			if (!match) {
				const match = text.match(/^<(https?:\/\/.*?)>/);
				if (!match) {
					return P.makeFailure(i, 'not a url');
				}
				url = match[1];
				i += 2;
			} else {
				url = match[0];
			}
			url = removeOrphanedBrackets(url);
			while (url.endsWith('.') || url.endsWith(',')) {
				if (url.endsWith('.')) url = url.substr(0, url.lastIndexOf('.'));
				if (url.endsWith(',')) url = url.substr(0, url.lastIndexOf(','));
			}
			return P.makeSuccess(i + url.length, url);
		}).map(x => createLeaf('url', { url: x }));
	},
	link: r => {
		const general = P.seqObj(
			['silent', P.string('?').fallback(null).map(x => x != null)] as any,
			P.string('['), ['text', P.regexp(/[^\n\[\]]+/)] as any, P.string(']'),
			P.string('('), ['url', r.url] as any, P.string(')'),
		);
		const nico = P((input, i) => {
			const text = input.substr(i);
			const nico =
				text.match(/^((?:lv|s[mo])\d+)(?:#((?:\d+:)?(?:[0-5]?\d:)?[0-5]\d|\d+))?/) || // videos
				text.match(/^(?:a[prz]|c[ho]|dw|gm|kn|im|jps|mylist\/|n[cqw]|user\/(?:illust\/)?)\d+/); // non-videos
			return nico && (input[i - 1] || ' ').match(/\W/) ? P.makeSuccess(i + nico[0].length, {
				text: nico[0],
				nico: true,
				silent: false,
				url: `https://nico.ms/${nico[1]}${nico[2] ? `?from=${nico[2].split(':').reverse().reduce((a, c, i) => a + ~~c * (60 ** i), 0)}` : ''}`
			}) : P.makeFailure(i, 'not a nicolink');
		});
		return P.alt(general, nico).map((x: any) => createTree('link', (x.nico ? r.text : r.inline).atLeast(1).tryParse(x.text), {
			nico: x.nico,
			silent: x.silent,
			url: typeof x.url === 'string' ? x.url : x.url.node.props.url
		}));
	},
	emoji: () => {
		const name = P((input, i) => {
			const text = input.substr(i);
			const [full, name] = text.match(/^:(@?[\w-]+(?:@[\w.-]+)?):\u200b*/i) || [null, null];
			const raw = `:${name}:`;
			return name && !name.match(/^[\d-]*$/) ? P.makeSuccess(i + full.length, { name, raw }) : P.makeFailure(i, 'not an emoji');
		});
		const code = P.regexp(emojiRegex, 1).map(emoji => ({ emoji, raw: emoji }));
		return P.alt(name, code).map(x => createLeaf('emoji', x));
	},
	text: () => P.any.map(x => createLeaf('text', { text: x }))
});
