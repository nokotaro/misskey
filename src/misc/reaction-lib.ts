import Emoji from '../models/emoji';
import { emojiRegex } from './emoji-regex';
import { toApHost, toDbHost } from './convert-host';

const basic10: Record<string, string> = {
	'👍': 'like',
	'❤': 'love',	// ここに記述する場合は異体字セレクタを入れない
	'😆': 'laugh',
	'🤔': 'hmm',
	'😮': 'surprise',
	'🎉': 'congrats',
	'💢': 'angry',
	'😥': 'confused',
	'😇': 'rip',
	'🍮': 'pudding',
};

const REACTION_STAR = '⭐';

export async function toDbReaction(reaction: string, enableEmoji = true, reacterHost?: string | null): Promise<string> {
	if (reaction == null) return REACTION_STAR;

	// 既存の文字列リアクションはそのまま
	if (Object.values(basic10).includes(reaction)) return reaction;

	if (!enableEmoji) return REACTION_STAR;

	// Unicode絵文字
	const match = emojiRegex.exec(reaction);
	if (match) {
		// 合字を含む1つの絵文字
		const unicode = match[0];

		// 異体字セレクタ除去後の絵文字
		const normalized = unicode.match('\u200d') ? unicode : unicode.replace(/\ufe0f/g, '');

		// Unicodeプリンは寿司化不能とするため文字列化しない
		if (normalized === '🍮') return normalized;

		// プリン以外の既存のリアクションは文字列化する
		if (basic10[normalized]) return basic10[normalized];

		// それ以外はUnicodeのまま
		return normalized;
	}

	const custom = reaction.match(/^:([\w+-]+):$/);
	if (custom) {
		const emoji = await Emoji.findOne({
			host: reacterHost ? toDbHost(reacterHost) : reacterHost,
			name: custom[1],
		});

		if (emoji) {
			const name = custom[1];
			// MongoDBのKeyに.が使えないので . => _ に変換する
			const encodedHost = reacterHost ? toApHost(reacterHost).replace(/\./g, '_') : reacterHost;

			const encodedReaction = encodedHost ? `:${name}@${encodedHost}:` : `:${name}:`;
			return encodedReaction;
		}
	}

	return REACTION_STAR;
}

export function decodeReaction(str: string) {
	const custom = str.match(/^:([\w+-]+)(?:@([\w.-]+))?:$/);

	if (custom) {
		const name = custom[1];
		const host = custom[2]?.replace(/_/g, '.') || '.';	// ローカルは.

		return `:${name}@${host}:`;
	}

	return str;
}

export function decodeReactionCounts(reactions: Record<string, number>) {
	const _reactions = {} as Record<string, number>;

	for (const reaction of Object.keys(reactions)) {
		_reactions[decodeReaction(reaction)] = reactions[reaction];
	}

	return _reactions;
}
