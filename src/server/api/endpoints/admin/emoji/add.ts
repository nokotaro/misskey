import $ from 'cafy';
import Emoji from '../../../../../models/emoji';
import define from '../../../define';
import { detectUrlMine } from '../../../../../misc/detect-url-mine';

export const meta = {
	desc: {
		'ja-JP': 'カスタム絵文字を追加します。'
	},

	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	params: {
		name: {
			validator: $.str.min(1)
		},

		url: {
			validator: $.str.min(1)
		},

		aliases: {
			validator: $.optional.arr($.str.min(1)),
			default: [] as string[]
		},

		contentType: {
			validator: $.optional.nullable.str,
			default: null as string
		}
	}
};

export default define(meta, async (ps) => {
	const contentType = ps.contentType || await detectUrlMine(ps.url);

	const emoji = await Emoji.insert({
		updatedAt: new Date(),
		name: ps.name,
		host: null,
		aliases: ps.aliases,
		contentType,
		url: ps.url
	});

	return {
		id: emoji._id
	};
});
