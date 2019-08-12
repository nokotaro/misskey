import Note from '../../../../models/note';
import define from '../../define';
import fetchMeta from '../../../../misc/fetch-meta';

export const meta = {
	tags: ['hashtags'],

	requireCredential: false,
};

export default define(meta, async (ps) => {
	const instance = await fetchMeta();
	const hidedTags = instance.hidedTags.map(t => t.toLowerCase());

	//#region 1. 指定期間の内に投稿されたハッシュタグ(とユーザーのペア)を集計
	const data = await Note.aggregate([{
		$match: {
			createdAt: {
				$gt: new Date(Date.now() - 2592e6)
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
			.filter(({ tag }) => !hidedTags.includes(tag))
			.reduce<Record<string, number>>((a, { tag }) => (a[tag] = a[tag] ? ++a[tag] : 1, a), Object.create(null)))
		.sort(([, a], [, b]) => b - a)
		.reduce<[string, number][]>((a, [k, v], i) => (i = a.findIndex(([x]) => x === k), ~i ? ++a[i][1] : a.push([k, v]), a), [])
		.sort(([, a], [, b]) => b - a)
		.map(([name, count]) => ({ name, count }));
});
