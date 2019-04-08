import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Favorite, { packMany as packManyFavorites } from '../../../../models/favorite';
import define from '../../define';
import Note, { packMany as packManyNotes } from '../../../../models/note';
import NoteReaction from '../../../../models/note-reaction';

export const meta = {
	desc: {
		'ja-JP': 'お気に入りに登録した投稿一覧を取得します。',
		'en-US': 'Get favorited notes'
	},

	tags: ['account', 'notes', 'favorites'],

	requireCredential: true,

	kind: 'favorites-read',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		reaction: {
			validator: $.optional.nullable.str,
			default: null as string
		},

		sinceId: {
			validator: $.optional.type(ID),
			transform: transform,
		},

		untilId: {
			validator: $.optional.type(ID),
			transform: transform,
		}
	}
};

export default define(meta, async (ps, user) => {
	const query = ps.reaction ? {
		userId: user._id,
		reaction: ps.reaction
	} : {
		userId: user._id
	} as any;

	const sort = {
		_id: -1
	};

	if (ps.sinceId) {
		sort._id = 1;
		query._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		query._id = {
			$lt: ps.untilId
		};
	}

	if (ps.reaction) {
		// Get reactions
		const reactions = await NoteReaction
			.find(query, {
				limit: ps.limit,
				sort: sort
			});

		// Get notes
		const notes = await Note
			.find({
				_id: { $in: reactions.map(x => x.noteId) }
			});

		return await packManyNotes(notes, user);
	} else {
		// Get favorites
		const favorites = await Favorite
			.find(query, {
				limit: ps.limit,
				sort: sort
			});

		return await packManyFavorites(favorites, user);
	}
});
