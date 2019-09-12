import $ from 'cafy';
import Note from '../../../../models/note';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';
import Instance from '../../../../models/instance';
import User from '../../../../models/user';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,

	params: {
		limit: {
			validator: $.optional.num.min(1),
			default: 100
		},

		rangeMilliseconds: {
			validator: $.optional.num.min(1),
			default: 2592e6
		}
	}
};

export default define(meta, async (ps) => {
	const instance = await fetchMeta();
	const hidedTags = instance.hidedTags.map(t => t.toLowerCase());
	const hidedInstances = await Instance.find({
		$or: [
			{ isBlocked: true },
			{ isMuted: true }
		]
	});
	const hidedUsers = await User.find({
		$or: [
			{ isBlocked: true },
			{ isSilenced: true }
		]
	});

	//#region 1. 指定期間の内に投稿されたハッシュタグ(とユーザーのペア)を集計
	const data = await Note.aggregate([{
		$match: {
			createdAt: {
				$gt: new Date(Date.now() - ps.rangeMilliseconds)
			},
			'_user.host': {
				$nin: hidedInstances.map(x => x.host)
			},
			userId: {
				$nin: hidedUsers.map(x => x._id)
			},
			tags: {
				$exists: true,
				$ne: []
			}
		}
	}, {
		$unwind: '$tags'
	}, {
		$group: {
			_id: { tag: '$tags', userId: '$userId' }
		}
	}]) as {
		_id: {
			tag: string;
			userId: any;
		}
	}[];
	//#endregion

	if (!data.length) {
		return [];
	}

	return Object
		.entries(data
			.map(({ _id }) => _id)
			.filter(({ tag }) => !hidedTags
				.map(x => x.toLowerCase())
				.includes(tag.toLowerCase()))
			.reduce<Record<string, number>>((a, { tag }) => (a[tag] = a[tag] ? ++a[tag] : 1, a), Object.create(null)))
		.sort(([, a], [, b]) => b - a)
		.reduce<[string, number][]>((a, [k, v], i) => (i = a.findIndex(([x]) => x.toLowerCase() === k.toLowerCase()), ~i ? a[i][1] += v : a.push([k, v]), a), [])
		.sort(([, a], [, b]) => b - a)
		.map(([name, count]) => ({ name, count }))
		.splice(0, ps.limit);
});
