import $ from 'cafy';
import Emoji from '../../../../../models/emoji';
import define from '../../../define';

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
			default: 'image/png'
		}
	}
};

export default define(meta, async (ps) => {
	const emoji = await Emoji.insert({
		updatedAt: new Date(),
		name: ps.name,
		host: null,
		aliases: ps.aliases,
		contentType: ps.contentType,
		url: ps.url
	});

	return {
		id: emoji._id
	};
});
